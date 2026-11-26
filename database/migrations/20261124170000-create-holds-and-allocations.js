
"use strict";

/**
 * Migration: seat_holds + seat_hold_items + show_seat_allocations
 *
 * seat_holds        — one hold per user/show attempt, with expiry
 * seat_hold_items   — which seats are in a hold
 * show_seat_allocations — single-row-per-sold-seat; enforces uniqueness at DB level
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {

      // ----------------------------------------------------------------
      // seat_holds
      // ----------------------------------------------------------------
      await queryInterface.createTable(
        "seat_holds",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          show_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "shows", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          // active | expired | cancelled | converted
          status: {
            type: Sequelize.ENUM("active", "expired", "cancelled", "converted"),
            allowNull: false,
            defaultValue: "active",
          },
          expires_at: {
            type: Sequelize.DATE,
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

      await queryInterface.addIndex("seat_holds", ["show_id", "status", "expires_at"], {
        name: "idx_seat_holds_show_status_expires",
        transaction,
      });

      await queryInterface.addIndex("seat_holds", ["user_id", "status"], {
        name: "idx_seat_holds_user_status",
        transaction,
      });

      // ----------------------------------------------------------------
      // seat_hold_items — seats reserved in a hold
      // ----------------------------------------------------------------
      await queryInterface.createTable(
        "seat_hold_items",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          hold_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "seat_holds", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          show_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "shows", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          seat_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "seats", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
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

      // A seat can appear only once per hold
      await queryInterface.addIndex("seat_hold_items", ["hold_id", "seat_id"], {
        unique: true,
        name: "uq_seat_hold_items_hold_seat",
        transaction,
      });

      // Fast lookup: which active holds claim this show+seat?
      await queryInterface.addIndex("seat_hold_items", ["show_id", "seat_id"], {
        name: "idx_seat_hold_items_show_seat",
        transaction,
      });

      // ----------------------------------------------------------------
      // show_seat_allocations — authoritative sold-seat table.
      // One row per confirmed sold seat per show. The UNIQUE constraint
      // here is the final guard against double booking.
      // ----------------------------------------------------------------
      await queryInterface.createTable(
        "show_seat_allocations",
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
          },
          show_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "shows", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          seat_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "seats", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          booking_id: {
            type: Sequelize.UUID,
            allowNull: true, // set when booking is confirmed
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

      // THE critical constraint: one seat per show, forever
      await queryInterface.addIndex("show_seat_allocations", ["show_id", "seat_id"], {
        unique: true,
        name: "uq_show_seat_allocations_show_seat",
        transaction,
      });

      await queryInterface.addIndex("show_seat_allocations", ["booking_id"], {
        name: "idx_show_seat_allocations_booking",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("show_seat_allocations", { transaction });
      await queryInterface.dropTable("seat_hold_items", { transaction });
      await queryInterface.dropTable("seat_holds", { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_seat_holds_status";',
        { transaction }
      );
    });
  },
};
