import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

// Keep the process alive and catch everything
process.stdin.resume();

process.on("uncaughtException", (err) => {
    console.error("💥 UNCAUGHT EXCEPTION:", err.message);
    console.error(err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 UNHANDLED REJECTION at:", promise);
    console.error("Reason:", reason);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT received");
    process.exit(0);
});

process.on("exit", (code) => {
    console.log(`Process exiting with code: ${code}`);
    console.trace("Exit trace:");
});

console.log("⏳ About to import app...");
import app from "./app";
console.log("✅ App imported");

console.log("⏳ About to import seed...");
import { seedSuperAdmin } from "./app/utils/seed";
console.log("✅ Seed imported");

const PORT = process.env.PORT || 3000;
console.log(`⏳ Starting server on port ${PORT}...`);

const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    try {
        console.log("⏳ Seeding...");
        await seedSuperAdmin();
        console.log("✅ Seeding done");
    } catch (err: any) {
        console.error("❌ Seed error:", err.message);
    }
    
    console.log("✅ Startup complete, server should stay alive");
});

// Keep alive check
setInterval(() => {
    console.log("♥️ Heartbeat");
}, 30000);