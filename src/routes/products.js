const express = require("express");
const router = express.Router();
const productModel = require("../data/products");
const userModel = require("../data/users");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false });
    }

    const user = userModel.verifyToken(token);
    if (!user) {
        return res.status(401).json({ success: false });
    }

    req.user = user;
    next();
};

router.get("/", (req, res) => {
    const result = productModel.getAll(req.query);
    res.json({
        success: true,
        count: result.products.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        data: result.products,
    });
});

router.get("/:id", (req, res) => {
    const product = productModel.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false });
    }
    res.json({ success: true, data: product });
});

router.post("/", authenticateToken, (req, res) => {
    const { name, description, price, category, quantity } = req.body;

    if (!name || !description || !price || !category) {
        return res.status(400).json({ success: false });
    }

    const product = productModel.create({
        name,
        description,
        price: Number(price),
        category,
        quantity: quantity ? Number(quantity) : 0,
        inStock: quantity ? Number(quantity) > 0 : false,
        createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: product });
});

router.put("/:id", authenticateToken, (req, res) => {
    const product = productModel.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false });
    }

    if (product.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ success: false });
    }

    const updated = productModel.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
});

router.delete("/:id", authenticateToken, (req, res) => {
    const product = productModel.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false });
    }

    if (product.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ success: false });
    }

    productModel.delete(req.params.id);
    res.json({ success: true });
});

router.get("/user/my-products", authenticateToken, (req, res) => {
    const products = productModel.getByUser(req.user.id);
    res.json({
        success: true,
        count: products.length,
        data: products,
    });
});

module.exports = router;
