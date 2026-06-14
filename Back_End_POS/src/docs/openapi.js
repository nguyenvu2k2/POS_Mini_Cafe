const successResponse = {
  description: 'Success',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
          meta: { type: 'object' },
        },
      },
    },
  },
};

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array', items: {} },
        },
      },
    },
  },
};

const auth = [{ bearerAuth: [] }];

const jsonBody = (schema) => ({
  required: true,
  content: {
    'application/json': { schema },
  },
});

const idParam = (name = 'id') => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
});

const pagingParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1 } },
];

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'POS Mini Cafe API',
    version: '1.0.0',
    description: 'Express + Sequelize REST API for POS Mini Cafe.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local POS server' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Categories' },
    { name: 'Products' },
    { name: 'Orders' },
    { name: 'Payments' },
    { name: 'Customers' },
    { name: 'Ingredients' },
    { name: 'Reports' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@pos.local',
          },
          password: { type: 'string', example: 'admin123456' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' },
        },
      },
      UserCreate: {
        type: 'object',
        required: ['role_id', 'name', 'email', 'password'],
        properties: {
          role_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Cashier 1' },
          email: {
            type: 'string',
            format: 'email',
            example: 'cashier@pos.local',
          },
          password: { type: 'string', example: 'cashier123' },
          phone: { type: 'string', example: '0900000000' },
          is_active: { type: 'boolean', example: true },
        },
      },
      Category: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Ca phe' },
          description: { type: 'string' },
          sort_order: { type: 'integer', example: 1 },
          is_active: { type: 'boolean', example: true },
        },
      },
      ProductCreate: {
        type: 'object',
        required: ['category_id', 'name'],
        properties: {
          category_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Ca phe sua da' },
          description: { type: 'string' },
          is_active: { type: 'boolean', example: true },
          variants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Vua' },
                price: { type: 'number', example: 30000 },
                is_available: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      ProductImageBase64: {
        type: 'object',
        required: ['image_base64'],
        properties: {
          image_base64: {
            type: 'string',
            description:
              'Legacy image data URL. The API stores it as a file and saves only the file URL in the database.',
            example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          },
          is_primary: { type: 'boolean', example: true },
          sort_order: { type: 'integer', example: 0 },
        },
      },
      RecipeUpdate: {
        type: 'object',
        properties: {
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              required: ['ingredient_id', 'quantity_required'],
              properties: {
                ingredient_id: { type: 'integer', example: 1 },
                quantity_required: { type: 'number', example: 18 },
              },
            },
          },
        },
      },
      OrderCreate: {
        type: 'object',
        required: ['items'],
        properties: {
          customer_id: { type: 'integer', nullable: true },
          discount: { type: 'number', example: 0 },
          note: { type: 'string' },
          table_no: { type: 'string', example: 'A1' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['variant_id', 'quantity'],
              properties: {
                variant_id: { type: 'integer', example: 2 },
                quantity: { type: 'integer', example: 1 },
                note: { type: 'string', example: 'it da' },
              },
            },
          },
        },
      },
      StatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
            example: 'preparing',
          },
        },
      },
      PaymentCreate: {
        type: 'object',
        required: ['method', 'amount'],
        properties: {
          method: {
            type: 'string',
            enum: ['cash', 'card', 'transfer', 'momo', 'vnpay'],
            example: 'cash',
          },
          amount: { type: 'number', example: 30000 },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed'],
            example: 'completed',
          },
          reference: { type: 'string' },
        },
      },
      Customer: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Nguyen Van A' },
          phone: { type: 'string', example: '0912345678' },
          email: { type: 'string', format: 'email' },
          note: { type: 'string' },
        },
      },
      Ingredient: {
        type: 'object',
        required: ['name', 'unit'],
        properties: {
          name: { type: 'string', example: 'Ca phe robusta' },
          unit: { type: 'string', example: 'g' },
          stock_quantity: { type: 'number', example: 5000 },
          min_stock: { type: 'number', example: 500 },
          cost_per_unit: { type: 'number', example: 250 },
          is_active: { type: 'boolean', example: true },
        },
      },
      ImportIngredient: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'number', example: 1000 },
          note: { type: 'string', example: 'Nhap kho dau ngay' },
        },
      },
      AdjustIngredient: {
        type: 'object',
        required: ['actual_quantity'],
        properties: {
          actual_quantity: { type: 'number', example: 4800 },
          unit: { type: 'string', example: 'g' },
          note: { type: 'string', example: 'Kiem ke cuoi ngay' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: { 200: successResponse },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive access/refresh tokens',
        requestBody: jsonBody({ $ref: '#/components/schemas/LoginRequest' }),
        responses: { 200: successResponse, 401: errorResponse },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: jsonBody({ $ref: '#/components/schemas/RefreshRequest' }),
        responses: { 200: successResponse, 401: errorResponse },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Blacklist refresh token in memory',
        requestBody: jsonBody({ $ref: '#/components/schemas/RefreshRequest' }),
        responses: { 200: successResponse },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        security: auth,
        summary: 'List users (admin)',
        responses: { 200: successResponse, 403: errorResponse },
      },
      post: {
        tags: ['Users'],
        security: auth,
        summary: 'Create user (admin)',
        requestBody: jsonBody({ $ref: '#/components/schemas/UserCreate' }),
        responses: { 201: successResponse, 422: errorResponse },
      },
    },
    '/api/users/{id}': {
      put: {
        tags: ['Users'],
        security: auth,
        summary: 'Update user (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/UserCreate' }),
        responses: { 200: successResponse, 404: errorResponse },
      },
      delete: {
        tags: ['Users'],
        security: auth,
        summary: 'Deactivate user (admin)',
        parameters: [idParam()],
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        security: auth,
        summary: 'List categories',
        parameters: [
          { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: successResponse },
      },
      post: {
        tags: ['Categories'],
        security: auth,
        summary: 'Create category (admin)',
        requestBody: jsonBody({ $ref: '#/components/schemas/Category' }),
        responses: { 201: successResponse },
      },
    },
    '/api/categories/{id}': {
      put: {
        tags: ['Categories'],
        security: auth,
        summary: 'Update category (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/Category' }),
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        security: auth,
        summary: 'List products',
        parameters: [
          { name: 'category_id', in: 'query', schema: { type: 'integer' } },
          { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'include',
            in: 'query',
            schema: { type: 'string', example: 'variants,images' },
          },
        ],
        responses: { 200: successResponse },
      },
      post: {
        tags: ['Products'],
        security: auth,
        summary: 'Create product with optional variants (admin)',
        requestBody: jsonBody({ $ref: '#/components/schemas/ProductCreate' }),
        responses: { 201: successResponse },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        security: auth,
        summary: 'Get product detail',
        parameters: [idParam()],
        responses: { 200: successResponse, 404: errorResponse },
      },
      put: {
        tags: ['Products'],
        security: auth,
        summary: 'Update product (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/ProductCreate' }),
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/products/{id}/images': {
      post: {
        tags: ['Products'],
        security: auth,
        summary: 'Upload product image and save only the file URL (admin)',
        parameters: [idParam()],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductImageBase64' },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                  is_primary: { type: 'boolean' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 201: successResponse, 400: errorResponse },
      },
    },
    '/api/products/{id}/variants/{vid}': {
      put: {
        tags: ['Products'],
        security: auth,
        summary: 'Update product variant (admin)',
        parameters: [idParam(), idParam('vid')],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Lon' },
            price: { type: 'number', example: 35000 },
            is_available: { type: 'boolean', example: true },
          },
        }),
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/products/{id}/variants/{vid}/recipe': {
      get: {
        tags: ['Products'],
        security: auth,
        summary: 'Get variant recipe',
        parameters: [idParam(), idParam('vid')],
        responses: { 200: successResponse, 404: errorResponse },
      },
      put: {
        tags: ['Products'],
        security: auth,
        summary: 'Replace variant recipe (admin)',
        parameters: [idParam(), idParam('vid')],
        requestBody: jsonBody({ $ref: '#/components/schemas/RecipeUpdate' }),
        responses: { 200: successResponse, 422: errorResponse },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Orders'],
        security: auth,
        summary: 'List orders',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          {
            name: 'date',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          { name: 'user_id', in: 'query', schema: { type: 'integer' } },
          ...pagingParams,
        ],
        responses: { 200: successResponse },
      },
      post: {
        tags: ['Orders'],
        security: auth,
        summary: 'Create order',
        requestBody: jsonBody({ $ref: '#/components/schemas/OrderCreate' }),
        responses: { 201: successResponse, 422: errorResponse },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        security: auth,
        summary: 'Get order detail',
        parameters: [idParam()],
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/orders/{id}/status': {
      put: {
        tags: ['Orders'],
        security: auth,
        summary: 'Update order status',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/StatusUpdate' }),
        responses: { 200: successResponse, 400: errorResponse },
      },
    },
    '/api/orders/{id}/items': {
      put: {
        tags: ['Orders'],
        security: auth,
        summary: 'Replace order items while pending',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/OrderCreate' }),
        responses: { 200: successResponse, 400: errorResponse },
      },
    },
    '/api/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        security: auth,
        summary: 'Cancel order',
        parameters: [idParam()],
        responses: { 200: successResponse, 400: errorResponse },
      },
    },
    '/api/orders/{id}/payments': {
      get: {
        tags: ['Payments'],
        security: auth,
        summary: 'List payments for order',
        parameters: [idParam()],
        responses: { 200: successResponse },
      },
      post: {
        tags: ['Payments'],
        security: auth,
        summary: 'Create payment for order',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/PaymentCreate' }),
        responses: { 201: successResponse, 400: errorResponse },
      },
    },
    '/api/payments/{id}/refund': {
      post: {
        tags: ['Payments'],
        security: auth,
        summary: 'Refund payment (admin)',
        parameters: [idParam()],
        responses: { 200: successResponse, 400: errorResponse },
      },
    },
    '/api/customers': {
      get: {
        tags: ['Customers'],
        security: auth,
        summary: 'List customers',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { 200: successResponse },
      },
      post: {
        tags: ['Customers'],
        security: auth,
        summary: 'Create customer',
        requestBody: jsonBody({ $ref: '#/components/schemas/Customer' }),
        responses: { 201: successResponse },
      },
    },
    '/api/customers/{id}': {
      get: {
        tags: ['Customers'],
        security: auth,
        summary: 'Get customer',
        parameters: [idParam()],
        responses: { 200: successResponse, 404: errorResponse },
      },
      put: {
        tags: ['Customers'],
        security: auth,
        summary: 'Update customer',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/Customer' }),
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/customers/{id}/orders': {
      get: {
        tags: ['Customers'],
        security: auth,
        summary: 'List customer orders',
        parameters: [idParam(), ...pagingParams],
        responses: { 200: successResponse },
      },
    },
    '/api/customers/{id}/points': {
      put: {
        tags: ['Customers'],
        security: auth,
        summary: 'Update loyalty points (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({
          type: 'object',
          required: ['loyalty_points'],
          properties: { loyalty_points: { type: 'integer', example: 10 } },
        }),
        responses: { 200: successResponse },
      },
    },
    '/api/ingredients': {
      get: {
        tags: ['Ingredients'],
        security: auth,
        summary: 'List ingredients',
        parameters: [
          { name: 'low_stock', in: 'query', schema: { type: 'boolean' } },
          { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: successResponse },
      },
      post: {
        tags: ['Ingredients'],
        security: auth,
        summary: 'Create ingredient (admin)',
        requestBody: jsonBody({ $ref: '#/components/schemas/Ingredient' }),
        responses: { 201: successResponse },
      },
    },
    '/api/ingredients/{id}': {
      put: {
        tags: ['Ingredients'],
        security: auth,
        summary: 'Update ingredient (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/Ingredient' }),
        responses: { 200: successResponse, 404: errorResponse },
      },
    },
    '/api/ingredients/{id}/import': {
      post: {
        tags: ['Ingredients'],
        security: auth,
        summary: 'Import ingredient stock (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({
          $ref: '#/components/schemas/ImportIngredient',
        }),
        responses: { 200: successResponse },
      },
    },
    '/api/ingredients/{id}/adjust': {
      post: {
        tags: ['Ingredients'],
        security: auth,
        summary: 'Adjust ingredient actual stock (admin)',
        parameters: [idParam()],
        requestBody: jsonBody({
          $ref: '#/components/schemas/AdjustIngredient',
        }),
        responses: { 200: successResponse },
      },
    },
    '/api/ingredients/{id}/logs': {
      get: {
        tags: ['Ingredients'],
        security: auth,
        summary: 'List ingredient logs',
        parameters: [
          idParam(),
          {
            name: 'action_type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['import', 'export_sale', 'export_waste', 'adjustment'],
            },
          },
          ...pagingParams,
        ],
        responses: { 200: successResponse },
      },
    },
    '/api/reports/revenue': {
      get: {
        tags: ['Reports'],
        security: auth,
        summary: 'Revenue report (admin)',
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'group_by',
            in: 'query',
            schema: { type: 'string', enum: ['day', 'week', 'month'] },
          },
        ],
        responses: { 200: successResponse },
      },
    },
    '/api/reports/top-products': {
      get: {
        tags: ['Reports'],
        security: auth,
        summary: 'Top products report (admin)',
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', example: 10 },
          },
        ],
        responses: { 200: successResponse },
      },
    },
    '/api/reports/inventory': {
      get: {
        tags: ['Reports'],
        security: auth,
        summary: 'Inventory report (admin)',
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: { 200: successResponse },
      },
    },
    '/api/reports/staff': {
      get: {
        tags: ['Reports'],
        security: auth,
        summary: 'Staff report (admin)',
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: { 200: successResponse },
      },
    },
    '/api/reports/low-stock': {
      get: {
        tags: ['Reports'],
        security: auth,
        summary: 'Low-stock report (admin)',
        responses: { 200: successResponse },
      },
    },
  },
};

module.exports = openapiSpec;
