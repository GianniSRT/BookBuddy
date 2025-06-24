const express = require('express');
const router = express.Router();

// [POST] Déclencher une action de gamification
router.post('/:type', (req, res) => {
  // À compléter selon ta logique de badge
  res.json({ message: `Badge ${req.params.type} attribué !` });
});

module.exports = router;