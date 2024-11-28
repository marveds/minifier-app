const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
require('dotenv').config();

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'images', 'app_icon.png'),
    osxSign: {
      identity: "Developer ID Application: Marvin Edwards (" + process.env.APPLE_TEAM_ID + ")", // Replace with your code signing identity
      hardenedRuntime: true, // Ensure this is set to true
      entitlements: path.join(__dirname, 'entitlements.plist'),
      entitlementsInherit: path.join(__dirname, 'entitlements.plist')
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        format: "ULFO"
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: '/images/app_icon.png',
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'marveds',
          name: 'minifier-app'
        },
        prerelease: true
      }
    }
  ]
};
