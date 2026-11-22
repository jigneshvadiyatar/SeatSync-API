
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("halls", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },

      venue_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "venues",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      floor: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
      "halls",
      ["venue_id", "code"],
      {
        unique: true,
        name: "uq_halls_venue_code",
      }
    );

    await queryInterface.addIndex(
      "halls",
      ["venue_id", "is_active"],
      {
        name: "idx_halls_venue_active",
      }
    );

    await queryInterface.addConstraint("halls", {
      fields: ["capacity"],
      type: "check",
      name: "chk_halls_capacity_positive",
      where: {
        capacity: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("halls");
  },
};
