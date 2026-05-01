import { DataTypes } from "sequelize";
import db from "./index.js";

const Audit = db.sequelize.define("Audit", {
  action: { type: DataTypes.STRING, allowNull: false },
  module: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  ip_address: { type: DataTypes.STRING, allowNull: true },
  user_agent: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "audits",
  timestamps: true
});

export default Audit;
