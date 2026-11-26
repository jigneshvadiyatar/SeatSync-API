module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const id = {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      };
      const reference = (model) => ({
        type: Sequelize.UUID,
        allowNull: false,
        references: { model, key: "id" },
        onDelete: "RESTRICT",
      });
      const timestamps = {
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      };

      await queryInterface.createTable("bookings", {
        id,
        user_id: reference("users"),
        show_id: reference("shows"),
        hold_id: { ...reference("seat_holds"), unique: true },
        idempotency_key: { type: Sequelize.STRING(128), allowNull: false },
        status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pending_payment" },
        total_minor: { type: Sequelize.BIGINT, allowNull: false },
        currency: { type: Sequelize.CHAR(3), allowNull: false },
        expires_at: { type: Sequelize.DATE, allowNull: false },
        ...timestamps,
      }, { transaction });

      await queryInterface.createTable("booking_items", {
        id,
        booking_id: { ...reference("bookings"), onDelete: "CASCADE" },
        show_id: reference("shows"),
        seat_id: reference("seats"),
        unit_price_minor: { type: Sequelize.BIGINT, allowNull: false },
        ...timestamps,
      }, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE bookings ADD CONSTRAINT bookings_state_and_amount_check
          CHECK (status IN ('pending_payment', 'confirmed', 'expired', 'cancelled', 'failed')
            AND total_minor >= 0);
        ALTER TABLE booking_items ADD CONSTRAINT booking_items_price_check
          CHECK (unit_price_minor >= 0);
      `, { transaction });

      await queryInterface.addIndex("bookings", ["user_id", "idempotency_key"], { unique: true, transaction });
      await queryInterface.addIndex("bookings", ["user_id", "created_at", "id"], { transaction });
      await queryInterface.addIndex("bookings", ["show_id", "status", "expires_at"], { transaction });
      await queryInterface.addIndex("bookings", ["expires_at"], {
        where: { status: "pending_payment" }, transaction,
      });
      await queryInterface.addIndex("booking_items", ["booking_id", "seat_id"], { unique: true, transaction });
      await queryInterface.addIndex("booking_items", ["show_id", "seat_id"], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("booking_items", { transaction });
      await queryInterface.dropTable("bookings", { transaction });
    });
  },
};
