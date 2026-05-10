import app from "./app";
import { seedSuperAdmin } from "./app/utils/seed";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Soul Space server running on http://localhost:${PORT}`);
  await seedSuperAdmin();
});
