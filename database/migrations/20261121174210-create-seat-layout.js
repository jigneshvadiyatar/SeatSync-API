
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable(
          "seat_categories",
          {
            id: {
              type: Sequelize.UUID,
              primaryKey: true,
              allowNull: false,
              defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            hall_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: "halls", key: "id" },
              onDelete: "RESTRICT",
              onUpdate: "CASCADE",
            },
            name: {
              type: Sequelize.STRING(60),
              allowNull: false,
            },
            code: {
              type: Sequelize.STRING(30),
              allowNull: false,
            },
            base_price: {
              type: Sequelize.DECIMAL(10, 2),
              allowNull: false,
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
          },
          { transaction }
        );

        await queryInterface.addIndex(
          "seat_categories",
          ["hall_id", "code"],
          {
            unique: true,
            name: "uq_seat_category_hall_code",
            transaction,
          }
        );

        // Required for the composite foreign key on seats.
        await queryInterface.addIndex(
          "seat_categories",
          ["hall_id", "id"],
          {
            unique: true,
            name: "uq_seat_category_hall_id",
            transaction,
          }
        );

        await queryInterface.addConstraint("seat_categories", {
          fields: ["base_price"],
          type: "check",
          name: "chk_seat_category_price",
          where: {
            base_price: { [Sequelize.Op.gte]: 0 },
          },
          transaction,
        });

        await queryInterface.createTable(
          "seats",
          {
            id: {
              type: Sequelize.UUID,
              primaryKey: true,
              allowNull: false,
              defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            hall_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: "halls", key: "id" },
              onDelete: "RESTRICT",
              onUpdate: "CASCADE",
            },
            category_id: {
              type: Sequelize.UUID,
              allowNull: false,
            },
            row_label: {
              type: Sequelize.STRING(10),
              allowNull: false,
            },
            seat_number: {
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
          },
          { transaction }
        );

        await queryInterface.addIndex(
          "seats",
          ["hall_id", "row_label", "seat_number"],
          {
            unique: true,
            name: "uq_seats_hall_position",
            transaction,
          }
        );

        await queryInterface.addIndex("seats", [
          "category_id",
        ], { transaction });

        await queryInterface.addConstraint("seats", {
          fields: ["seat_number"],
          type: "check",
          name: "chk_seat_number_positive",
          where: {
            seat_number: { [Sequelize.Op.gt]: 0 },
          },
          transaction,
        });

        // A seat's category must belong to the same hall.
        await queryInterface.sequelize.query(
          `ALTER TABLE seats
           ADD CONSTRAINT fk_seats_hall_category
           FOREIGN KEY (hall_id, category_id)
           REFERENCES seat_categories (hall_id, id)
           ON UPDATE CASCADE
           ON DELETE RESTRICT`,
          { transaction }
        );
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable("seats", { transaction });
        await queryInterface.dropTable(
          "seat_categories",
          { transaction }
        );
      }
    );
  },
};
