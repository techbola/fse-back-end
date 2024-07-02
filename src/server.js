import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_DB_URL;
const client = new MongoClient(url);

const app = express();
app.use(bodyParser.json());

// get all products
app.get("/api/products", async (req, res) => {
  await client.connect();
  const db = client.db("fse-vue");
  const products = await db.collection("products").find({}).toArray();

  res.status(200).json(products);

  client.close();
});

// get user cart
app.get("/api/users/:userId/cart", async (req, res) => {
  await client.connect();
  const db = client.db("fse-vue");

  const userId = req.params.userId;
  const user = await db.collection("users").findOne({ id: userId });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const products = await db.collection("products").find({}).toArray();

  const cartItemsIds = user.cartItems;

  if (!cartItemsIds || cartItemsIds.length === 0) {
    res.status(200).json([]);
    return;
  }

  const cartItems = cartItemsIds.map((id) => {
    return products.find((product) => product.id === id);
  });

  res.status(200).json(cartItems);

  client.close();
});

// get single product
app.get("/api/products/:productId", async (req, res) => {
  await client.connect();
  const db = client.db("fse-vue");

  const productId = req.params.productId;
  const product = await db.collection("products").findOne({ id: productId });

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.status(200).json(product);

  client.close();
});

// add user product to cart
app.post("/api/users/:userId/cart", async (req, res) => {
  await client.connect();
  const db = client.db("fse-vue");

  const { userId } = req.params;
  const { productId } = req.body;

  const product = await db.collection("products").findOne({ id: productId });

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  await db.collection("users").updateOne(
    { id: userId },
    {
      $addToSet: {
        cartItems: productId,
      },
    }
  );

  const user = await db.collection("users").findOne({ id: userId });
  const cartItemsIds = user.cartItems;
  const products = await db.collection("products").find({}).toArray();

  const cartItems = cartItemsIds.map((id) => {
    return products.find((product) => product.id === id);
  });

  res.status(200).json(cartItems);
  client.close();
});

// delete user product from cart
app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
  await client.connect();
  const db = client.db("fse-vue");

  const { userId, productId } = req.params;

  const product = await db.collection("products").findOne({ id: productId });

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  await db.collection("users").updateOne(
    { id: userId },
    {
      $pull: {
        cartItems: productId,
      },
    }
  );

  const user = await db.collection("users").findOne({ id: userId });
  const cartItemsIds = user.cartItems;
  const products = await db.collection("products").find({}).toArray();

  const cartItems = cartItemsIds.map((id) => {
    return products.find((product) => product.id === id);
  });

  res.status(200).json(cartItems);
  client.close();
});

app.listen(8000, () => {
  console.log("Server is listening on port 8000");
});
