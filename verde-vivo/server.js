import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const dataPath = path.join(__dirname, "data", "products.json");
const products = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/products", (req, res) => {
  const { category, q } = req.query;
  let result = products;

  if (category) {
    result = result.filter((item) => item.category === category);
  }

  if (q) {
    const query = q.toLowerCase();
    result = result.filter((item) =>
      [item.name, item.description, item.brand].some((field) =>
        field.toLowerCase().includes(query)
      )
    );
  }

  res.json(result);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Produto não encontrado." });
  }
  return res.json(product);
});

app.get("/api/categories", (req, res) => {
  const categories = Array.from(new Set(products.map((item) => item.category)));
  res.json(categories);
});

app.get("/api/featured", (req, res) => {
  res.json(products.filter((item) => item.featured));
});

app.post("/api/checkout", (req, res) => {
  const { items, customer } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Carrinho vazio." });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderId = `MRJ-${Math.floor(Math.random() * 90000 + 10000)}`;

  return res.json({
    orderId,
    total,
    estimatedDelivery: "3-5 dias úteis",
    message: `Obrigado pela compra${customer?.name ? `, ${customer.name}` : ""}!`,
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Servidor ativo em http://localhost:${port}`);
});
