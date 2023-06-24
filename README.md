
# create-wpstarter

This script makes it easy to set up a new WordPress project with the right structure and configuration. It uses WP-CLI and NPM to automate the setup process, saving you from repetitive manual work.

## Prerequisites

Before you run the script, make sure you have the following tools installed on your system:

- MySQL client
- Git
- PHP
- WP-CLI

## Usage

You can use the script directly with npx:

```bash
npx create-wpstarter [target-directory]
```

If you don't specify a target directory, the script will use 'wpstarter' as the default name.

After starting the script, you will be guided through a series of questions to configure your new WordPress site.

## Configuration

During the setup, you will be prompted to enter:

- Site title
- Blog description
- Theme name
- Database credentials
- Admin username, password, and email
- Plugins to install

You can choose to save these settings for future projects. The saved configuration will be stored in the '.wpstarter' directory in your home folder.

## What the script does

The script performs the following steps:

1. Checks if the required tools are installed.
2. Clones the repository from `https://github.com/msteinerweb/wpstarter.git`.
3. Prompts for configuration and saves it (if desired).
4. Installs dependencies.
5. Installs WordPress using WP-CLI.
6. Outputs success message and instructions for starting the development server.

If anything goes wrong during the setup, the script will clean up the target directory and exit.
