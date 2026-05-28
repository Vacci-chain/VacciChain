require('dotenv').config();
const { initializeSecrets } = require('./secrets');
const config = require('./config');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const logger = require('./logger');
const { initDb } = require('./indexer/db');
const { startPoller, stopPoller } = require('./indexer/poller');
const swaggerSpec = require('./swagger');

const authRoutes = require('./routes/auth');
const vaccinationRoutes = require('./routes/vaccination');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const eventsRoutes = require('./routes/events');
const patientRoutes = require('./routes/patient');
const consentRoutes = require('./routes/consent');
const onboardingRoutes = require('./routes/onboarding');
const apiVersion = require('./middleware/apiVersion');
const securityHeaders = require('./middleware/securityHeaders');
const { getRpcServer } = require('./stellar/soroban');
const { getHealthStatus, startHealthProbe } = require('./health');

const requestId = require('./middleware/requestId');
const { sanitizeInputs } = require('./middleware/sanitize');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  optionsSuccessStatus: 204,
}));
app.use(securityHeaders);
app.use(express.json({ limit: config.BODY_LIMIT }));
app.use(requestId);
// Sanitize all string inputs at the API boundary (strips HTML tags, control chars, null bytes)
app.use(sanitizeInputs);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      requestId: req.requestId,
      method: req.method,
      route: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

app.use('/auth', authRoutes);
app.use('/vaccination', vaccinationRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);
app.use('/events', eventsRoutes);

// v1 routes — all API endpoints are versioned under /v1/
const v1 = express.Router();
v1.use(apiVersion);
v1.use('/auth', authRoutes);
v1.use('/vaccination', vaccinationRoutes);
v1.use('/verify', verifyRoutes);
v1.use('/admin', adminRoutes);
v1.use('/patient', patientRoutes);
v1.use('/patient', consentRoutes);
v1.use('/events', eventsRoutes);
v1.use('/onboarding', onboardingRoutes);
app.use('/v1', v1);

// Legacy unversioned routes — 308 redirect to /v1/ with Deprecation header
app.use(['/auth', '/vaccination', '/verify', '/admin', '/patient', '/events'], (req, res) => {
  res.setHeader('Deprecation', 'true');
  res.redirect(308, `/v1${req.originalUrl}`);
});


/**
 * Health check endpoint.
 *
 * @route GET /health
 * @returns {Object} 200 - { status: "ok", uptime }
 * @returns {Object} 503 - { status: "degraded", uptime }
 */
app.get('/health', async (_req, res) => {
  const body = getHealthStatus();
  res.status(body.status === 'ok' ? 200 : 503).json(body);
});

if (require.main === module) {
  initializeSecrets().then(() => {
    initDb(config.DATABASE_PATH).then(() => {
      startPoller(config.EVENT_POLL_INTERVAL_MS);
        startHealthProbe();
      const server = app.listen(config.PORT, () => {
        logger.info(`Backend running on port ${config.PORT}`);
      });

      const gracefulShutdown = (signal) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);
        
        stopPoller();

        server.close(() => {
          logger.info('Http server closed.');
          process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    });
  }).catch(error => {
    logger.error(`Failed to initialize secrets: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;
