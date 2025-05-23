const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 8000;
const DATA_FILE = path.join(__dirname, "MOCK_DATA.json");

app.use(express.urlencoded({ extended: false }));
app.use(express.json()); 

// Hybrid route: HTML view
app.get("/users", async (req, res) => {
  try {
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const users = JSON.parse(fileContent);

    const html = `
      <ul>
        ${users.map((user) => `<li>${user.first_name}</li>`).join("")}
      </ul>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Internal server error.");
  }
});

// API: List users (JSON)
app.get("/api/users", async (req, res) => {
  res.setHeader("X-MyName", "Paul Simon");

  try {
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const users = JSON.parse(fileContent);

    if (!users.length) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json({ users });
  } catch (err) {
    console.error("Error fetching users: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Useful when the route is same for different methods
app
  .route("/api/users/:id")
  .get(async (req, res) => {
    const id = Number(req.params.id);

    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      const users = JSON.parse(fileContent);

      const user = users.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  })
  .put(async (req, res) => {
    const id = Number(req.params.id);
    const updatedBody = req.body;

    if (!updatedBody) {
        return res.status(400).json({ message: "No data sent for updation" })
    }

    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      const users = JSON.parse(fileContent);

      const user = users.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      Object.assign(user, {
        first_name: updatedBody.first_name,
        last_name: updatedBody.last_name,
        email: updatedBody.email,
        gender: updatedBody.gender,
        job_title: updatedBody.job_title,
      });

      await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");

      return res.status(200).json({ status: "Successfully updated!" });
    } catch (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  })
  .delete(async (req, res) => {
    const id = Number(req.params.id);

    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      let users = JSON.parse(fileContent);

      const index = users.findIndex((u) => u.id === id);
      if (index === -1) {
        return res.status(404).json({ message: "User not found" });
      }

      users.splice(index, 1);

      await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");

      return res.status(200).json({ message: "User successfully deleted." });
    } catch (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });


app.post("/api/users", async (req, res) => {
  const body = req.body;

  try {
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const users = JSON.parse(fileContent);

    const newUser = {
      id: users.length ? users[users.length - 1].id + 1 : 1,
      ...body,
    };

    users.push(newUser);

    await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");

    return res.status(201).json({ status: "success", id: newUser.id });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => console.log(`\nServer started at port: ${PORT}\n`));
