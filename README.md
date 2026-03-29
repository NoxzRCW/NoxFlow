# 🔷 FossFLOW - Modern Isometric Diagramming

<p align="center">
  <img width="120" height="120" alt="FossFLOW Logo" src="https://github.com/user-attachments/assets/56d78887-601c-4336-ab87-76f8ee4cde96" />
</p>

<p align="center">
  <b>A powerful, open-source Progressive Web App (PWA) for creating beautiful isometric network diagrams and infrastructure architectures.</b>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-whats-new">What's New</a> •
  <a href="#-quick-deploy">Deploy</a> •
  <a href="#-local-development">Development</a> •
  <a href="#-acknowledgements">Acknowledgements</a>
</p>

---

## 📖 About FossFLOW

FossFLOW is designed for developers, network engineers, and system administrators who need to visualize their infrastructure clearly and beautifully. Built with React and the powerful [Isoflow](https://github.com/markmanx/isoflow) library, it runs entirely in your browser with full offline support.

Forget fighting with complex proprietary diagramming tools. Just drag, drop, and connect to create stunning isometric representations of your systems and networks.

![Screenshot](https://github.com/user-attachments/assets/e7f254ad-625f-4b8a-8efc-5293b5be9d55)

## ✨ Features

- 🖥️ **Progressive Web App (PWA)**: Works completely offline right in your browser.
- 🎨 **Isometric Graphics**: Beautiful, consistent 3D-like visuals for your architectures.
- 💾 **Storage Options**: Save directly to your browser session, or export/import JSON files.
- ⚡ **Lightweight & Fast**: Highly optimized React frontend ensuring a responsive, snappy experience.
- 📦 **Docker Ready**: Quick and easy self-hosted deployments securely isolated in containers.

### 🌟 What's New? (Latest Evolutions)
* **Advanced Inventory Management**: Nodes now support detailed inventory fields, including **IP Address, Hostname, and OS**, allowing for comprehensive infrastructure tracking right from your diagrams.
* **Streamlined Local Docker Build**: The `compose.yml` has been updated to build efficiently and directly from the local repository, making self-hosting smoother than ever.
* **Modernized Core**: Fully upgraded to the latest React ecosystem (including React Router DOM v7+) for better performance, modern standards, and rock-solid stability.

---

## 🐳 Quick Deploy (Docker)

The fastest and most reliable way to get your own instance of FossFLOW running is via Docker. Server storage is enabled by default, saving your diagrams securely to `./diagrams` on your host machine.

```bash
# Clone the repository
git clone https://github.com/your-username/FossFLOW.git
cd FossFLOW

# Build and run using Docker Compose (Recommended)
docker compose up -d --build
```

### Advanced Docker Usage

**Disable Server Storage:**
To run without persisting files to the local host directory:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false fossflow-local
```

**Enable Basic Authentication:**
Protect your diagrams by setting up HTTP Basic Auth:
```bash
# With Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# With run
docker run -p 80:80 -e HTTP_AUTH_USER=admin -e HTTP_AUTH_PASSWORD=secret fossflow-local
```
*(Note: Both variables must be set to enable authentication)*

---

## 🛠️ Local Development

FossFLOW is structured as a monorepo containing the component library (`fossflow-lib`) and the web application (`fossflow-app`).

### Prerequisites
- Node.js (v18+)
- npm

### Setup & Run

```bash
# Clone the repository
git clone https://github.com/your-username/FossFLOW.git
cd FossFLOW

# Install all dependencies across the monorepo
npm install

# Build the library (required for first-time setup only)
npm run build:lib

# Start the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your app running locally.

### Useful Commands
| Command | Description |
|---|---|
| `npm run dev` | Start app development server |
| `npm run dev:lib` | Watch mode for library development |
| `npm run build` | Build both library and app |
| `npm test` | Run unit tests |
| `npm run lint` | Check for linting errors |
| `./run-tests.sh` | Run E2E tests in the `e2e-tests` folder (requires Docker/Python) |

---

## 📚 How to Use

1. **Add Nodes**: Click the **"+"** button on the top right to open the component library. Drag and drop any items onto exactly where you want them on the canvas.
2. **Connect Infrastructure**: Press **'C'** (or click the connector icon) to select the Connector tool. Click your first node, then the second node to link them.
3. **Manage Inventory**: Double click on a node to add useful metadata like *IP Address*, *Hostname*, and *Operating System*.
4. **Export Your Work**: Save your architecture locally or export it as a JSON file to share with your team.

---

## 🤝 Contributing

We welcome contributions! Whether it's adding new components, fixing bugs, or improving documentation, check out our [Contributing Guidelines](CONTRIBUTING.md) to get started on your first PR.

For a deeper dive into how the application is built and architected, read the [FossFLOW Encyclopedia](FOSSFLOW_ENCYCLOPEDIA.md).

---

## 🙏 Acknowledgements

FossFLOW wouldn't be possible without the open-source community. A huge thanks to:
* [@markmanx](https://github.com/markmanx) for creating the core [Isoflow](https://github.com/markmanx/isoflow) drawing library.
* [@stan-smith](https://github.com/stan-smith) for earlier versions and foundation of this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
