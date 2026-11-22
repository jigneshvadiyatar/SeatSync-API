
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("venues", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "India",
      },

      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },

      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex(
      "venues",
      ["city", "is_active"],
      { name: "idx_venues_city_active" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("venues");
  },
};
