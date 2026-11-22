
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        // Required for the PostgreSQL GiST exclusion constraint.
        await queryInterface.sequelize.query(
          "CREATE EXTENSION IF NOT EXISTS btree_gist;",
          { transaction }
        );

        await queryInterface.createTable(
          "shows",
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("gen_random_uuid()"),
              primaryKey: true,
              allowNull: false,
            },

            event_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: "events",
                key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },

            hall_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: "halls",
                key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },

            starts_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },

            ends_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },

            booking_opens_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },

            booking_closes_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },

            status: {
              type: Sequelize.ENUM(
                "scheduled",
                "cancelled",
                "completed"
              ),
              allowNull: false,
              defaultValue: "scheduled",
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

        await queryInterface.createTable(
          "show_seat_prices",
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("gen_random_uuid()"),
              primaryKey: true,
              allowNull: false,
            },

            show_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: "shows",
                key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },

            seat_category_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: "seat_categories",
                key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },

            price: {
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

        // A show must end after it starts.
        await queryInterface.sequelize.query(
          `
          ALTER TABLE "shows"
          ADD CONSTRAINT "chk_shows_time_order"
          CHECK ("ends_at" > "starts_at");
          `,
          { transaction }
        );

        // Booking window must be either entirely unset or valid.
        await queryInterface.sequelize.query(
          `
          ALTER TABLE "shows"
          ADD CONSTRAINT "chk_shows_booking_window"
          CHECK (
            (
              "booking_opens_at" IS NULL
              AND "booking_closes_at" IS NULL
            )
            OR
            (
              "booking_opens_at" IS NOT NULL
              AND "booking_closes_at" IS NOT NULL
              AND "booking_opens_at" < "booking_closes_at"
              AND "booking_closes_at" <= "starts_at"
            )
          );
          `,
          { transaction }
        );

        // Prevent overlapping shows in the same hall.
        // Cancelled shows do not reserve the hall's time slot.
        await queryInterface.sequelize.query(
          `
          ALTER TABLE "shows"
          ADD CONSTRAINT "ex_shows_hall_time_no_overlap"
          EXCLUDE USING gist (
            "hall_id" WITH =,
            tstzrange("starts_at", "ends_at", '[)') WITH &&
          )
          WHERE ("status" <> 'cancelled');
          `,
          { transaction }
        );

        // One price per category per show.
        await queryInterface.addIndex(
          "show_seat_prices",
          ["show_id", "seat_category_id"],
          {
            unique: true,
            name: "uq_show_seat_prices_show_category",
            transaction,
          }
        );

        await queryInterface.sequelize.query(
          `
          ALTER TABLE "show_seat_prices"
          ADD CONSTRAINT "chk_show_seat_prices_non_negative"
          CHECK ("price" >= 0);
          `,
          { transaction }
        );

        await queryInterface.addIndex(
          "shows",
          ["event_id", "starts_at"],
          {
            name: "idx_shows_event_starts",
            transaction,
          }
        );

        await queryInterface.addIndex(
          "shows",
          ["hall_id", "starts_at"],
          {
            name: "idx_shows_hall_starts",
            transaction,
          }
        );

        await queryInterface.addIndex(
          "shows",
          ["status", "starts_at"],
          {
            name: "idx_shows_status_starts",
            transaction,
          }
        );
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable("show_seat_prices", {
          transaction,
        });

        await queryInterface.dropTable("shows", {
          transaction,
        });

        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_shows_status";',
          { transaction }
        );
      }
    );
  },
};
