import type { OpenAPIV3_1 } from 'openapi-types';

const serverUrl = process.env.SWAGGER_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

export const swaggerDocument: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'GCLI Payment API',
    version: '1.0.0',
    description:
      'Express wrapper for DOKU payment gateway integrations. Supports payment creation, update, cancellation, status checks, scheduled cancellation, and webhook handling with signature verification.'
  },
  servers: [
    {
      url: serverUrl,
      description: 'Local server'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Service availability'
    },
    {
      name: 'Payments',
      description: 'DOKU payment wrapper endpoints'
    },
    {
      name: 'Webhooks',
      description: 'Webhook endpoint for DOKU transaction notifications'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                },
                examples: {
                  ok: {
                    value: {
                      message: 'ok'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/payments': {
      post: {
        tags: ['Payments'],
        summary: 'Create payment',
        operationId: 'createPayment',
        description: 'Creates payment by forwarding request to DOKU create payment API.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreatePaymentRequest'
              },
              examples: {
                qris: {
                  summary: 'QRIS payment example',
                  value: {
                    order: {
                      amount: 150000,
                      invoice_number: 'INV-20260209-001',
                      currency: 'IDR'
                    },
                    payment: {
                      payment_due_date: 60
                    },
                    customer: {
                      id: 'CUST-001',
                      name: 'John Doe',
                      email: 'john@example.com'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenericDokuResponse'
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequestError'
          },
          '500': {
            $ref: '#/components/responses/InternalServerError'
          }
        }
      }
    },
    '/api/payments/{invoiceNumber}': {
      patch: {
        tags: ['Payments'],
        summary: 'Modify payment',
        operationId: 'modifyPayment',
        description:
          'Modifies an existing payment with invoiceNumber. Uses configured modify endpoint, or fallback endpoint if not provided.',
        parameters: [
          {
            $ref: '#/components/parameters/InvoiceNumberPath'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ModifyPaymentRequest'
              },
              examples: {
                updateAmount: {
                  value: {
                    order: {
                      amount: 200000,
                      currency: 'IDR'
                    },
                    customer: {
                      name: 'Updated Customer'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment modified successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenericDokuResponse'
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequestError'
          },
          '500': {
            $ref: '#/components/responses/InternalServerError'
          }
        }
      }
    },
    '/api/payments/cancel': {
      post: {
        tags: ['Payments'],
        summary: 'Cancel payment',
        operationId: 'cancelPayment',
        description: 'Cancels payment by forwarding request to DOKU cancel endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CancelPaymentRequest'
              },
              examples: {
                cancelByReason: {
                  value: {
                    invoice_number: 'INV-20260209-001',
                    reason: 'Customer requested cancellation'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment canceled successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenericDokuResponse'
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequestError'
          },
          '500': {
            $ref: '#/components/responses/InternalServerError'
          }
        }
      }
    },
    '/api/payments/cancel/schedule': {
      post: {
        tags: ['Payments'],
        summary: 'Schedule payment cancellation',
        operationId: 'scheduleCancelPayment',
        description: 'Schedules cancellation at a future UTC date-time (ISO-8601 format).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ScheduleCancelRequest'
              },
              examples: {
                schedule: {
                  value: {
                    cancel_at: '2026-02-10T14:00:00Z',
                    payload: {
                      invoice_number: 'INV-20260209-001',
                      reason: 'Auto-cancel unpaid order'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '202': {
            description: 'Cancellation successfully scheduled',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ScheduleCancelResponse'
                },
                examples: {
                  accepted: {
                    value: {
                      message: 'Cancellation scheduled for 2026-02-10T14:00:00.000Z'
                    }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequestError'
          },
          '500': {
            $ref: '#/components/responses/InternalServerError'
          }
        }
      }
    },
    '/api/payments/{invoiceNumber}/status': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment status',
        operationId: 'getPaymentStatus',
        description: 'Fetches latest transaction state from DOKU order status endpoint.',
        parameters: [
          {
            $ref: '#/components/parameters/InvoiceNumberPath'
          }
        ],
        responses: {
          '200': {
            description: 'Current payment status returned',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenericDokuResponse'
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequestError'
          },
          '500': {
            $ref: '#/components/responses/InternalServerError'
          }
        }
      }
    },
    '/api/webhooks/doku': {
      post: {
        tags: ['Webhooks'],
        summary: 'Handle DOKU webhook',
        operationId: 'handleDokuWebhook',
        description:
          'Receives DOKU webhook notifications. Validates signature and logs failed/already-paid notifications for historical tracking.',
        parameters: [
          {
            $ref: '#/components/parameters/ClientIdHeader'
          },
          {
            $ref: '#/components/parameters/RequestIdHeader'
          },
          {
            $ref: '#/components/parameters/RequestTimestampHeader'
          },
          {
            $ref: '#/components/parameters/SignatureHeader'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DokuWebhookPayload'
              },
              examples: {
                failed: {
                  summary: 'Failed transaction webhook',
                  value: {
                    order: {
                      invoice_number: 'INV-20260209-001'
                    },
                    transaction: {
                      status: 'FAILED'
                    },
                    message: 'Transaction failed due to timeout'
                  }
                },
                paid: {
                  summary: 'Already paid transaction webhook',
                  value: {
                    order: {
                      invoice_number: 'INV-20260209-002'
                    },
                    transaction: {
                      status: 'PAID'
                    },
                    message: 'Transaction already paid'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook accepted and processed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WebhookResponse'
                },
                examples: {
                  processed: {
                    value: {
                      message: 'Webhook processed'
                    }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequestError'
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError'
          },
          '500': {
            $ref: '#/components/responses/InternalServerError'
          }
        }
      }
    },
    '/api/docs.json': {
      get: {
        tags: ['Health'],
        summary: 'Get OpenAPI JSON',
        operationId: 'getApiSpecJson',
        responses: {
          '200': {
            description: 'OpenAPI document',
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    parameters: {
      InvoiceNumberPath: {
        name: 'invoiceNumber',
        in: 'path',
        required: true,
        description: 'Invoice number used by merchant and DOKU',
        schema: {
          type: 'string',
          minLength: 1
        }
      },
      ClientIdHeader: {
        name: 'Client-Id',
        in: 'header',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'DOKU client identifier'
      },
      RequestIdHeader: {
        name: 'Request-Id',
        in: 'header',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Unique request identifier generated by DOKU'
      },
      RequestTimestampHeader: {
        name: 'Request-Timestamp',
        in: 'header',
        required: true,
        schema: {
          type: 'string',
          format: 'date-time'
        },
        description: 'RFC3339 timestamp from DOKU'
      },
      SignatureHeader: {
        name: 'Signature',
        in: 'header',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'HMAC signature from DOKU'
      }
    },
    responses: {
      BadRequestError: {
        description: 'Validation or malformed request error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            examples: {
              badRequest: {
                value: {
                  message: 'invoiceNumber path param is required'
                }
              }
            }
          }
        }
      },
      UnauthorizedError: {
        description: 'Signature validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            examples: {
              unauthorized: {
                value: {
                  message: 'Invalid webhook signature'
                }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            examples: {
              internal: {
                value: {
                  message: 'Internal server error'
                }
              }
            }
          }
        }
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          }
        },
        required: ['message']
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          }
        },
        required: ['message']
      },
      CreatePaymentRequest: {
        type: 'object',
        properties: {
          invoice_number: {
            type: 'string'
          },
          amount: {
            type: 'number',
            exclusiveMinimum: 0
          },
          order: {
            type: 'object',
            additionalProperties: true
          },
          payment: {
            type: 'object',
            additionalProperties: true
          },
          customer: {
            type: 'object',
            additionalProperties: true
          }
        },
        additionalProperties: true
      },
      ModifyPaymentRequest: {
        allOf: [
          {
            $ref: '#/components/schemas/CreatePaymentRequest'
          }
        ]
      },
      CancelPaymentRequest: {
        type: 'object',
        properties: {
          invoice_number: {
            type: 'string',
            minLength: 1
          },
          reason: {
            type: 'string'
          }
        },
        required: ['invoice_number'],
        additionalProperties: true
      },
      ScheduleCancelRequest: {
        type: 'object',
        properties: {
          cancel_at: {
            type: 'string',
            format: 'date-time',
            description: 'Future date-time in UTC'
          },
          payload: {
            $ref: '#/components/schemas/CancelPaymentRequest'
          }
        },
        required: ['cancel_at', 'payload']
      },
      ScheduleCancelResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          }
        },
        required: ['message']
      },
      DokuWebhookPayload: {
        type: 'object',
        properties: {
          invoice_number: {
            type: 'string'
          },
          order: {
            type: 'object',
            properties: {
              invoice_number: {
                type: 'string'
              }
            },
            additionalProperties: true
          },
          transaction: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['FAILED', 'SUCCESS', 'PAID']
              }
            },
            additionalProperties: true
          },
          message: {
            type: 'string'
          }
        },
        additionalProperties: true
      },
      WebhookResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          }
        },
        required: ['message']
      },
      GenericDokuResponse: {
        type: 'object',
        description: 'Raw passthrough response from DOKU API.',
        additionalProperties: true
      }
    }
  }
};
