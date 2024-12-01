# Minifier App

![Minifier App](https://img.shields.io/github/v/release/marveds/minifier-app)

Minifier App is an Electron-based desktop application that helps you watch and minify files automatically in a selected folder. The app listens for changes in JavaScript, CSS, SCSS, and other supported files, and minifies them on-the-fly to help you save time and ensure your files are always optimized.

## Features

- **Watch Folder**: Select a folder to watch, and the app automatically detects changes in supported files.
- **Automatic Minification**: Minify JavaScript, CSS, SCSS, and more whenever files are added or modified.
- **Simple User Interface**: Easy-to-use tray and window-based user interface for selecting folders and managing the minification process.
- **Cross-Platform**: Available on Windows, macOS, and Linux.

## Installation

To install the Minifier App, download the latest release from the [Releases Page](https://github.com/marveds/minifier-app/releases).

1. Go to the [Releases Page](https://github.com/marveds/minifier-app/releases).
2. Download the appropriate installer for your operating system.
3. Run the installer and follow the instructions to complete the setup.

## Windows:
1. Download and extract the zip files
2. Run .\win_setup_and_build.cmd : this will install Prerequisites and create a .msi installer in the \dist folder.
3. Run the .msi file to install the app
4. Cleanup folders by running .\win_cleanup_folders.cmd.

If you need to separate the install Prerequisites and build processes. Use win_setup_dependencies.cmd and win_build_app.cmd as needed.

## Usage

1. Open the Minifier App.
2. Click the **Select Folder** button to choose a folder to watch.
3. The app will automatically detect changes and minify supported files when they are modified.
4. To stop watching a folder, click the **EYE** button at the top
5. To remove watch folder and stop watching click the **Trash** next button of next to the to the folder name in the list.

## Building from Source

If you want to build Minifier App from the source, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)

### Clone the Repository

```bash
git clone https://github.com/marveds/minifier-app.git
cd minifier-app
```

### Install Dependencies

```bash
npm install
```

### Run the App in Development Mode

```bash
npm start
```

### Build the Application

To package the app for your platform:
Check package.json for other build/package options

```bash
npm run make
```

The build output can be found in the `out` directory.

## Technologies Used

- **Electron**: Cross-platform desktop application framework.
- **Webpack**: JavaScript bundler to handle minification.
- **Chokidar**: File watcher for monitoring changes in selected folders.
- **Terser**: JavaScript minifier for optimizing JavaScript files.

## Contributing

Contributions are welcome! If you would like to contribute to this project, please fork the repository and create a pull request.

### Steps to Contribute

1. Fork this repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to your forked repository (`git push origin feature-branch`).
5. Create a pull request on GitHub.

## Issues

If you encounter any issues or have suggestions, feel free to open an issue in the [Issues Page](https://github.com/marveds/minifier-app/issues).

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/marveds/minifier-app/blob/main/LICENSE) file for more details.

## Acknowledgements

- [Electron](https://www.electronjs.org/)
- [Webpack](https://webpack.js.org/)
- [Terser](https://github.com/terser/terser)
- [Chokidar](https://github.com/paulmillr/chokidar)
- [Tailwind](https://tailwindcss.com)

---

For more information, visit the [Minifier App GitHub page](https://github.com/marveds/minifier-app).

