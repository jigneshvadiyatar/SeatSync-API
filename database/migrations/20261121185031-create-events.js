
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable(
          "events",
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("gen_random_uuid()"),
              primaryKey: true,
              allowNull: false,
            },

            title: {
              type: Sequelize.STRING(200),
              allowNull: false,
            },

            slug: {
              type: Sequelize.STRING(220),
              allowNull: false,
              unique: true,
            },

            description: {
              type: Sequelize.TEXT,
              allowNull: true,
            },

            category: {
              type: Sequelize.STRING(30),
              allowNull: false,
            },

            language: {
              type: Sequelize.STRING(50),
              allowNull: true,
            },

            duration_minutes: {
              type: Sequelize.INTEGER,
              allowNull: true,
            },

            age_rating: {
              type: Sequelize.STRING(20),
              allowNull: true,
            },

            poster_url: {
              type: Sequelize.TEXT,
              allowNull: true,
            },

            banner_url: {
              type: Sequelize.TEXT,
              allowNull: true,
            },

            status: {
              type: Sequelize.ENUM(
                "draft",
                "published",
                "archived"
              ),
              allowNull: false,
              defaultValue: "draft",
            },

            published_at: {
              type: Sequelize.DATE,
              allowNull: true,
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
          "events",
          ["status", "created_at"],
          {
            name: "idx_events_status_created",
            transaction,
          }
        );

        await queryInterface.addIndex(
          "events",
          ["category", "status"],
          {
            name: "idx_events_category_status",
            transaction,
          }
        );

        await queryInterface.addConstraint("events", {
          fields: ["duration_minutes"],
          type: "check",
          name: "chk_events_duration_positive",
          where: {
            duration_minutes: {
              [Sequelize.Op.gt]: 0,
            },
          },
          transaction,
        });

        await queryInterface.addConstraint("events", {
          fields: ["category"],
          type: "check",
          name: "chk_events_category",
          where: {
            category: {
              [Sequelize.Op.in]: [
                "movie",
                "concert",
                "theatre",
                "sports",
                "other",
              ],
            },
          },
          transaction,
        });
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable("events", {
          transaction,
        });

        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_events_status";',
          { transaction }
        );
      }
    );
  },
};
