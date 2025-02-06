import ShopifyClient from '../clients/shopify-client.js';
import config from '../config/store-config.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class ShopifyError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ShopifyError';
    this.status = status;
    this.details = details;
  }
}

export const createShopifyClient = () => {
  try {
    const { storeName, accessToken, apiVersion } = config.shopify;
    
    if (!storeName || !accessToken) {
      throw new Error('Missing Shopify credentials');
    }

    // Remove .myshopify.com if it's included in the store name
    const cleanStoreName = storeName.replace('.myshopify.com', '');
    
    logger.debug('Creating Shopify client', { store: cleanStoreName });
    
    return new ShopifyClient(
      cleanStoreName,
      accessToken,
      apiVersion
    );
  } catch (error) {
    logger.error('Failed to create Shopify client:', error);
    throw error;
  }
};

export const validateProductData = (product) => {
  const errors = [];
  
  if (!product) {
    throw new ShopifyError('Product data is required', 400);
  }

  // Enhanced SKU validation
  if (!product.sku) {
    errors.push('SKU is required');
  } else if (typeof product.sku !== 'string' || product.sku.trim().length === 0) {
    errors.push('SKU must be a non-empty string');
  }

  if (!product.title) {
    errors.push('Title is required');
  }

  // Validate product ID if present
  if (product.id && !isValidShopifyId(product.id)) {
    errors.push('Invalid product ID format');
  }

  // Additional variant validation
  if (product.variants) {
    if (!Array.isArray(product.variants)) {
      errors.push('Variants must be an array');
    } else {
      product.variants.forEach((variant, index) => {
        if (variant.id && !isValidShopifyId(variant.id)) {
          errors.push(`Invalid variant ID format at index ${index}`);
        }
      });
    }
  }

  if (errors.length > 0) {
    logger.warn('Product validation failed', { 
      product: { sku: product.sku, title: product.title },
      errors 
    });
    throw new ShopifyError('Invalid product data', 400, errors);
  }

  return true;
};

export const sanitizeProductData = (product) => {
  return {
    ...product,
    sku: product.sku?.trim(),
    title: product.title?.trim(),
    variants: product.variants?.map(variant => ({
      ...variant,
      sku: variant.sku?.trim()
    }))
  };
};

export const processProduct = async (client, product) => {
  try {
    const sanitizedProduct = sanitizeProductData(product);
    
    try {
      validateProductData(sanitizedProduct);
    } catch (validationError) {
      logger.warn('Skipping invalid product', {
        sku: product.sku,
        title: product.title,
        errors: validationError.details
      });
      return null;
    }

    return await retryOperation(
      async () => await client.updateProduct(sanitizedProduct),
      { 
        operation: 'processProduct',
        product: { 
          sku: sanitizedProduct.sku,
          title: sanitizedProduct.title 
        },
        requestBody: sanitizedProduct  // Add request body for debugging
      }
    );
  } catch (error) {
    logger.error('Shopify API request failed while processing product', {
      sku: product.sku,
      title: product.title,
      error: error.message,
      details: error.details || {},
      status: error.status
    });
    throw error;
  }
};

export const isValidShopifyId = (id) => {
  if (!id) return false;
  // Shopify IDs are numeric strings or numbers, but API expects strings
  return /^[0-9]+$/.test(id.toString());
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const handleShopifyError = async (error, context = {}, retryCount = 0) => {
  const errorDetails = {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    requestId: error.response?.headers?.['x-request-id'],
    retryCount,
    ...context
  };

  logger.error('Shopify API request failed', errorDetails);

  if (error.response?.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10);
    logger.warn('Rate limited by Shopify API:', { ...errorDetails, retryAfter });
    await delay(retryAfter * 1000);
    if (retryCount < MAX_RETRIES) {
      return { shouldRetry: true, delay: retryAfter * 1000 };
    }
  }

  if (error.response?.status === 400) {
    const apiErrors = error.response?.data?.errors;
    logger.error('Invalid Shopify API request:', { 
      ...errorDetails,
      apiErrors,
      requestBody: context.requestBody 
    });
    
    // Handle specific validation errors
    if (apiErrors?.id === 'expected String to be a id') {
      throw new ShopifyError(
        'Invalid ID format in Shopify request',
        400,
        { ...apiErrors, help: 'Product and variant IDs must be numeric strings' }
      );
    }
    
    throw new ShopifyError(
      `Shopify API request failed: ${error.message}`,
      400, 
      apiErrors || error.response?.data
    );
  }

  if (error.response?.status === 404) {
    logger.warn('Resource not found in Shopify:', errorDetails);
    throw new ShopifyError('Resource not found', 404, error.response?.data);
  }

  logger.error('Unexpected Shopify API error:', errorDetails);
  throw new ShopifyError('Unexpected error', error.response?.status || 500, errorDetails);
};

export const retryOperation = async (operation, context) => {
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      return await operation();
    } catch (error) {
      const result = await handleShopifyError(error, context, retryCount);
      if (result?.shouldRetry) {
        retryCount++;
        await delay(RETRY_DELAY * retryCount);
        continue;
      }
      throw error;
    }
  }
  
  throw new ShopifyError('Max retries exceeded', 500);
};

export const validateShopifyConnection = async (client) => {
  return retryOperation(async () => {
    logger.debug('Validating Shopify connection');
    const products = await client.getProducts();
    
    if (!Array.isArray(products)) {
      throw new ShopifyError('Invalid API response', 500);
    }
    
    logger.info('Successfully validated Shopify connection');
    return true;
  }, { operation: 'validateConnection' });
};

export default {
  createShopifyClient,
  validateShopifyConnection,
  validateProductData,
  isValidShopifyId,
  handleShopifyError,
  retryOperation,
  sanitizeProductData,
  processProduct
};
