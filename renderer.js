const { ipcRenderer } = window.electron;

const folderList = document.getElementById('folderList');
const logOutput = document.getElementById('logOutput');
const clearLogButton = document.getElementById('clear-logs-button');
const pathInput = document.getElementById('pathInput');
const folderSelection = document.getElementById('folderSelection');
const logView = document.getElementById('logView');
const startWatchButton = document.getElementById('start-watch-button');
const addFolderButton = document.getElementById('add-folder-button');

const watchStatusButton = document.getElementById('watchStatusButton');
const watchIcon = document.getElementById('watchIcon');
// let isWatching = false;

function updateWatchIcon() {
    if (isWatching) {
        watchIcon.classList.remove('fa-eye-slash');
        watchIcon.classList.add('fa-eye');
        watchStatusButton.classList.add('text-green-500');
        watchStatusButton.classList.remove('text-gray-500');
    } else {
        watchIcon.classList.remove('fa-eye');
        watchIcon.classList.add('fa-eye-slash');
        watchStatusButton.classList.add('text-gray-500');
        watchStatusButton.classList.remove('text-green-500');
    }
}

// Event listener for the watch status button to start/stop watching
watchStatusButton.addEventListener('click', () => {
    if (folderList.children.length === 0) {
        ipcRenderer.notify('Folder Watch', 'No folders available to watch.');
        return;
    }

    if (isWatching) {
        ipcRenderer.send('stop-watching-all');
        isWatching = false;
        const stopButtons = document.querySelectorAll('.stop-button');
        stopButtons.forEach((button) => {
            button.style.display = 'none';
        });
    } else {
        startWatchButton.click();
        isWatching = true;
        const stopButtons = document.querySelectorAll('.stop-button');
        stopButtons.forEach((button) => {
            button.style.display = 'block';
            button.style.width = '30px';
        });
    }

    updateWatchIcon();
});

document.getElementById('toggleMenu').addEventListener('click', () => {
    const sideMenu = document.querySelector('.w-64');
    sideMenu.classList.toggle('hidden');
});

document.getElementById('showFolders').addEventListener('click', () => {
    folderSelection.style.display = 'block';
    logView.style.display = 'none';
});

document.getElementById('showLogs').addEventListener('click', () => {
    folderSelection.style.display = 'none';
    logView.style.display = 'block';
});

addFolderButton.addEventListener('click', () => {
    const folderPath = pathInput.value.trim();
    if (folderPath) {
        ipcRenderer.send('check-folder-exists', folderPath);
        ipcRenderer.once('folder-exists-result', (event, exists) => {
            if (exists && !Array.from(folderList.children).some(li => li.textContent === folderPath)) {
                const li = document.createElement('li');
                li.textContent = folderPath;
                folderList.appendChild(li);
                pathInput.value = '';
                const folders = Array.from(folderList.children).map(li => li.textContent);
                ipcRenderer.send('start-watch', { folders });
                watchFolders(folders);
            } else {
                ipcRenderer.notify('Add Foldeer', 'Path does not exist or is already in the list.');
            }
        });
    }
});

document.getElementById('select-folder-button').addEventListener('click', () => {
    ipcRenderer.send('select-folder');
});

startWatchButton.addEventListener('click', () => {
    // const folders = Array.from(folderList.children).map(li => li.textContent);
    const folders = Array.from(folderList.children).map(li => {
        return li.firstChild.textContent.trim();
    });
    document.getElementById('showLogs').click();
    ipcRenderer.send('start-watch', { folders });
});

ipcRenderer.on('selected-folders', (event, folders) => {
    // ipcRenderer.notify('Selected folders:', folders);
    watchFolders(folders);
});

function watchFolders(folders) {
    const uniqueFolders = [...new Set(folders)];
    folderList.innerHTML = '';
    uniqueFolders.forEach(folder => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.justifyContent = 'space-between';

        li.textContent = folder;

        const stopButton = document.createElement('i');
        stopButton.className = 'fa-solid fa-trash-can ml-4 text-gray-800 p-2 hover:text-red-500 cursor-pointer stop-button';
        stopButton.style.marginLeft = 'auto';
        stopButton.addEventListener('click', () => {
            folderList.removeChild(li);
            ipcRenderer.send('stop-watching-folder', folder);
            clearLogButton.click();
            if (folderList.children.length > 0) {
                isWatching = true;
            } else {
                isWatching = false;
            }
            updateWatchIcon();
        });

        li.appendChild(stopButton);
        folderList.appendChild(li);

        isWatching = true;
        updateWatchIcon();
    });
}

document.getElementById('clear-paths-button').addEventListener('click', () => {
    ipcRenderer.send('clear-saved-paths');
});

ipcRenderer.on('paths-cleared', () => {
    ipcRenderer.notify('Cleared Folder', 'Saved paths cleared successfully.');
    folderList.innerHTML = '';
    clearLogButton.click();
    isWatching = false;
    updateWatchIcon();
});

ipcRenderer.on('watch-update', (event, message) => {
    addMessage('Watch Update', message);
});

ipcRenderer.on('watch-error', (event, message) => {
    addMessage('Watch Error', message, true);
});

ipcRenderer.on('debug-message', (event, message) => {
    addMessage('Debug', message);
});

function addMessage(type, message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `[${type}] ${message}`;
    if (isError) {
        messageDiv.style.color = 'red';
    }
    logOutput.appendChild(messageDiv);
    logOutput.scrollTop = logOutput.scrollHeight;
    updateClearButtonState();
}

clearLogButton.addEventListener('click', () => {
    logOutput.innerHTML = '';
    updateClearButtonState();
    // Optionally, send a message to the main process if needed
    // ipcRenderer.send('clear-main-log');
});

function updateClearButtonState() {
    clearLogButton.disabled = logOutput.children.length === 0;
}

updateClearButtonState();
