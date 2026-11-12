'use strict';
// routes/payments.js
//
// Make POST /payments idempotent using an Idempotency-Key.

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required.'
      }
    });
  }

  const cached = idempotency.get(key);
  if (cached) {
    return res.status(cached.status).json(cached.body);
  }

  const amount = req.body && req.body.amount;
  const charge = { id: nextChargeId(), amount, status: 'charged' };
  const body = { id: charge.id, amount: charge.amount, status: charge.status };

  charges.push(charge);
  idempotency.set(key, { status: 201, body });

  return res.status(201).json(body);
});

module.exports = router;
