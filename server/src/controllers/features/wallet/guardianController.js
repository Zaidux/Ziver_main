const asyncHandler = require('express-async-handler');
const Guardian = require('../../../models/Guardian');

const guardianController = {
  // Add guardian
  addGuardian: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { email, phone, name, relationship } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Guardian name is required'
      });
    }

    // Check guardian limit
    const canAdd = await Guardian.canAddGuardian(userId);
    if (!canAdd) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of guardians (5) reached'
      });
    }

    // Add guardian
    const guardian = await Guardian.addGuardian(userId, {
      email,
      phone,
      name,
      relationship
    });

    res.status(201).json({
      success: true,
      guardian: {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
        relationship: guardian.relationship,
        isActive: guardian.is_active,
        createdAt: guardian.created_at
      },
      message: 'Guardian added successfully'
    });
  }),

  // Get user's guardians
  getGuardians: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const guardians = await Guardian.getUserGuardians(userId);

    res.json({
      success: true,
      guardians: guardians.map(guardian => ({
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
        relationship: guardian.relationship,
        isActive: guardian.is_active,
        createdAt: guardian.created_at
      })),
      count: guardians.length,
      maxGuardians: 5
    });
  }),

  // Remove guardian
  removeGuardian: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const guardian = await Guardian.getById(id);
    
    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    // Check ownership
    if (guardian.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this guardian'
      });
    }

    await Guardian.removeGuardian(id);

    res.json({
      success: true,
      message: 'Guardian removed successfully'
    });
  }),

  // Update guardian
  updateGuardian: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const guardian = await Guardian.getById(id);
    
    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    // Check ownership
    if (guardian.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this guardian'
      });
    }

    // Update guardian (simplified - in production, implement proper update)
    // For now, we'll remove and recreate
    await Guardian.removeGuardian(id);
    const updatedGuardian = await Guardian.addGuardian(userId, {
      ...guardian,
      ...updates
    });

    res.json({
      success: true,
      guardian: {
        id: updatedGuardian.id,
        name: updatedGuardian.name,
        email: updatedGuardian.email,
        phone: updatedGuardian.phone,
        relationship: updatedGuardian.relationship,
        isActive: updatedGuardian.is_active,
        createdAt: updatedGuardian.created_at
      },
      message: 'Guardian updated successfully'
    });
  })
};

module.exports = guardianController;