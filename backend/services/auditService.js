import Audit from "../modeles/Audit.js";

class AuditService {

  static async log(req, action, module, description) {
    try {
      await Audit.create({
        action,
        module,
        description,
        user_id: req.user?.id || null,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"]
      });
    } catch (error) {
      console.error("Erreur audit :", error);
    }
  }

}

export default AuditService;
