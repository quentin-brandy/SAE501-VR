const dropContainer = document.getElementById('dropcontainer');
const inputFile = document.getElementById('images');
const removeButton = document.getElementById('remove-file');
const fileForm = document.getElementById('file-form');
const fileInfo = document.getElementById('file-info');
const fileNameDisplay = document.getElementById('file-name');
const dropTitle = document.querySelector('.drop-title');
let selectedFile = null;

// Gestion du drag-and-drop
dropContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropContainer.classList.add('drag-over');
});

dropContainer.addEventListener('dragleave', () => {
    dropContainer.classList.remove('drag-over');
});

dropContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    dropContainer.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
        inputFile.files = e.dataTransfer.files;
        handleFileSelected(e.dataTransfer.files[0]);
    }
});

// Gestion de l'input file
inputFile.addEventListener('change', (e) => {
    if (inputFile.files.length) {
        handleFileSelected(inputFile.files[0]);
    }
});

// Gère la sélection d'un fichier
function handleFileSelected(file) {
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileInfo.style.display = 'flex';
    dropTitle.style.display = 'none'; // Cache le texte par défaut
    inputFile.disabled = true;
}

// Bouton pour supprimer le fichier sélectionné
removeButton.addEventListener('click', () => {
    inputFile.disabled = false;
    inputFile.value = ''; // Réinitialise l'input
    selectedFile = null;
    fileInfo.style.display = 'none';
    dropTitle.style.display = 'block'; // Réaffiche le texte par défaut
});

// Gestion de l'envoi de fichier lors du submit du formulaire
fileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedFile) {
        alert('Aucun fichier sélectionné');
        return;
    }

    const formData = new FormData();
    formData.append('archive', selectedFile);
    formData.append('email', document.querySelector('#email').value); // Ajoutez l'email ici

    try {
        const response = await fetch('http://localhost:3000/watch', {
            method: 'POST',
            body: formData,
        });

        // Vérifiez si la réponse est OK
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('Upload impossible: le zip n\'est pas conforme ou a été modifié');
            } else if (response.status === 500) {
                throw new Error('Erreur 500: L\'email n\'a pas pu être envoyé, veuillez réessayer');
            } else {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
        }

        const responseData = await response.json();
        console.log('Réponse:', responseData);

        if (responseData.url) {
            const link = document.createElement('a');
            link.href = responseData.url;
            link.textContent = 'Le lien vers votre application est disponible ici';
            link.target = responseData.url;
            fileNameDisplay.innerHTML = ''; 
            fileNameDisplay.appendChild(link);
        } 
    } catch (error) {
        console.error('Erreur lors de l\'envoi du fichier:', error);
        fileNameDisplay.textContent = `Erreur lors de l'envoi du fichier: ${error.message}`;
    }
});

