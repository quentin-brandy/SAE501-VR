import  VR  from './main.js';
import { AddSceneExplorer, LoadSceneExplorer  } from './SceneManager.js';
import { ModifyDoor , TakeDoor } from './DoorManager.js';
import { ModifyText } from './TextManager.js';
import { TagManager , Door, Text , Photo } from './Tagclass.js';
import { ModifyPhoto } from './PhotoManager.js';

export function LoadSlider(e) {
    const ratio = (e.value - e.min) / (e.max - e.min) * 100;
    const activeColor = "#00C058";
    const inactiveColor = "transparent";

    e.style.background = `linear-gradient(90deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`;

}


// Fonction pour générer un nom unique
function generateUniqueName(baseName, tags, type) {
    let newName = baseName;
    let count = 1;
    while (tags.some(tag => tag.name === newName)) {
        newName = `${baseName}_copy${count}`;
        count++;
    }
    return newName;
}




export function TagPositionChange(e, tagType) {
    const tagName = document.getElementById(`${tagType}-name`).textContent; // "door-name" ou "text-name"
    const sceneSelect = document.getElementById('selectscene');
    const selectedScene = VR.scenes[sceneSelect.value];
    const axis = e.target.name; // 'x', 'y', or 'z'
    const newPosition = parseFloat(e.target.value);

    // Mettre à jour l'affichage de la valeur du slider
    document.querySelector(`#${axis}-value`).textContent = `${newPosition}`;

    // Créer une instance de TagManager pour gérer les tags
    const tagManager = new TagManager(selectedScene);

    // Mettre à jour la position en utilisant la méthode moveTag
    const updatedTag = tagManager.moveTag(tagName, { ...selectedScene.tags.find(tag => tag.type === tagType && tag.name === tagName).position, [axis]: newPosition });

    // Si le tag a été mis à jour, mettre à jour l'entité dans la scène A-Frame
    if (updatedTag) {
        const tagElement = document.querySelector(`#${tagType}-entity #${tagName}`);
        if (tagElement) {
            tagElement.setAttribute('position', `${updatedTag.position.x} ${updatedTag.position.y} ${updatedTag.position.z}`);
        }

        // Mise à jour du dégradé linéaire du slider
       LoadSlider(e.target);

    }
}



export function renameTag(type, nom) {
    const sceneName = document.getElementById('selectscene').value;
    const scene = VR.scenes[sceneName];
    const inputRename = document.getElementById('rename').value;
    const spanError = document.getElementById('span__error');
    
    const tagManager = new TagManager(scene);

    // Vérifier si le nouveau nom existe déjà
    if (tagManager.getTag(inputRename)) {
        spanError.innerHTML = "Ce nom existe déjà !";
        return;
    }
    
    if (inputRename === "") {
        spanError.innerHTML = "Le champ ne peut pas être vide";
        return;
    }
    
    spanError.innerHTML = ""; // Clear the error message
    
    const tag = tagManager.getTag(nom);
    let tagScene = document.querySelector(`#${type}-entity #${nom}`);

    if (tag) {
        tagManager.renameTag(nom, inputRename);

        // Mettre à jour l'ID de l'entité dans A-Frame
        if (tagScene) {
            tagScene.setAttribute('id', inputRename);
        }

        AddSceneExplorer(inputRename, type);
        LoadSceneExplorer();
        
        if (type === 'door') {
            ModifyDoor({ target: { id: inputRename } });
        } else if (type === 'text') {
            ModifyText({ target: { id: inputRename } });
        }
        else if (type === 'photo') {
            ModifyPhoto({ target: { id: inputRename } });
        }
    }
}
export function duplicateTag(tagType) {
    const tagName = document.getElementById(`${tagType}-name`).textContent;
    const sceneSelect = document.getElementById('selectscene');
    const selectedScene = VR.scenes[sceneSelect.value];

    const tagManager = new TagManager(selectedScene);

    // Récupérer le tag original
    const originalTag = tagManager.getTag(tagName);

    if (originalTag) {
        const newTagName = generateUniqueName(originalTag.name, selectedScene.tags, tagType);
        const newPosition = { ...originalTag.position };

        let clonedTag;

        // Créer une nouvelle instance basée sur le type de tag
        if (tagType === 'text') {
            clonedTag = new Text(selectedScene).addTextTag(newTagName, newPosition, originalTag.rotation, originalTag.content, originalTag.fill);
        } else if (tagType === 'door') {
            clonedTag = new Door(selectedScene).addDoorTag(newTagName, newPosition, originalTag.targetScene);
        }
        if (tagType === 'photo') {
            clonedTag = new Photo(selectedScene).addPhotoTag(newTagName, newPosition);
        }

        // Ajouter le tag cloné à la scène
        tagManager.addTag(clonedTag);

        // Créer l'entité correspondante dans A-Frame
        createEntity(tagType, clonedTag);

        console.log(VR);
        AddSceneExplorer(newTagName, tagType);
        loadTag();
        console.log(`Tag dupliqué: ${newTagName}`);

        if (tagType === 'door') {
            ModifyDoor({target: {id: newTagName}});
        } else if (tagType === 'text') {
            ModifyText({target: {id: newTagName}});
        }
        else if (tagType === 'photo') {
            ModifyPhoto({target: {id: newTagName}});
        }
    }
}


export function deleteTag(tagType) {
    const tagName = document.getElementById(`${tagType}-name`).textContent;
    const sceneSelect = document.getElementById('selectscene');
    const selectedScene = VR.scenes[sceneSelect.value];

    // Initialisation du TagManager avec la scène sélectionnée
    const tagManager = new TagManager(selectedScene);

    // Supprimer le tag via TagManager
    const tagElement = document.querySelector(`#${tagType}-entity #${tagName}`);
    const deletedTag = tagManager.getTag(tagName);

    if (deletedTag) {
        tagManager.deleteTag(tagName);  // Supprime le tag de la scène via TagManager
        tagElement.remove();  // Supprime l'élément de la scène A-Frame

        console.log(`Tag supprimé: ${tagName}`);
        let templateSection = document.getElementById('template_section');
        templateSection.className = '';
        templateSection.innerHTML = '';
        LoadSceneExplorer();  // Recharge la scène
    } else {
        console.log("Tag non trouvé");
    }
}


function createEntity(tag) {
    let newEntity;
    if (tag.type === 'door') {
        newEntity = document.createElement('a-sphere');
        newEntity.setAttribute('position', `${tag.position.x} ${tag.position.y} ${tag.position.z}`);
        newEntity.setAttribute('radius', '1');
        newEntity.setAttribute('color', '#FF0000');
        newEntity.setAttribute('class', 'link clickable');
        newEntity.setAttribute('scale', '0.5 0.5 0.5');
        newEntity.setAttribute('id', tag.name);
        newEntity.addEventListener('click', function (event) {
            TakeDoor(event);
        });
        document.querySelector('#rightController').addEventListener('triggerdown', function (event) {
            if (event.target === newEntity) {
                TakeDoor(event);
            }
        });
    } else if (tag.type === 'text') {
        newEntity = document.createElement('a-text');
        newEntity.setAttribute('position', `${tag.position.x} ${tag.position.y} ${tag.position.z}`);
        newEntity.setAttribute('value', tag.content);
        newEntity.setAttribute('color', tag.fill);
        newEntity.setAttribute('align', 'center');
        newEntity.setAttribute('scale', '5 5 5');
        newEntity.setAttribute('id', tag.name);
        newEntity.object3D.rotation.set(tag.rotation.x, tag.rotation.y, tag.rotation.z);
    }
    if(tag.type === 'photo') {
        newEntity = document.createElement('a-image');
        newEntity.setAttribute('position', `${tag.position.x} ${tag.position.y} ${tag.position.z}`);
        newEntity.setAttribute('src', './assets/img/sky.jpg');
        newEntity.setAttribute('scale', '1 1 1');
        newEntity.setAttribute('id', tag.name);
        newEntity.object3D.rotation.set(0, tag.rotation.y, tag.rotation.z);
        document.querySelector('#rightController').addEventListener('grip-down', function (event) {
            if (event.target === newEntity) {
                // Logique pour déplacer la photo
                console.log(`Photo ${tag.name} moved`);
            }
        });
    }

    return newEntity;
}



// déplacement 


let isMoving = false; // Assurez-vous que cette variable est en dehors de la fonction pour garder son état

export function toggleMove(Name) {
    const sceneEl = document.querySelector('a-scene'); // Assurez-vous que la scène est correctement sélectionnée

    function handleSceneClick(event) {
        // Trouver l'élément sur lequel on a cliqué en utilisant `event.target`
        const clickedElement = document.querySelector(`#${Name}`);
        console.log(clickedElement);
        // Si l'élément a une classe ou un attribut indiquant son type, récupérons-le
        let Type = clickedElement.getAttribute('data-type') || 
                   (clickedElement.classList.contains('door') ? 'door' : 
                   (clickedElement.classList.contains('text') ? 'text' : 
                   (clickedElement.classList.contains('photo') ? 'photo' : null))); // Remplace 'data-type' par l'attribut qui te convient si besoin
  
        // Appeler `handleMove` avec le nom de l'élément et le type récupéré dynamiquement
        handleMove(event, Name, Type);

        // Désactiver le mouvement après un clic
        isMoving = false;
        sceneEl.removeEventListener('click', handleSceneClick);
    }

    // Si nous venons d'activer le mouvement
    if (!isMoving) {
        isMoving = true; // Marquer comme en mouvement

        // Ajouter un listener pour le clic sur la scène
        sceneEl.addEventListener('click', handleSceneClick);
    } else {
        isMoving = false; // Désactiver le mouvement

        // Supprimer le listener lorsque le mouvement est désactivé
        sceneEl.removeEventListener('click', handleSceneClick);
    }
}

export function handleMove(event, Name, Type) {
    console.log(Name);

    if (!event.clientX || !event.clientY) {
        console.error("Les coordonnées de l'écran ne sont pas disponibles. Assurez-vous que l'événement est un 'click' ou similaire.");
        return;
    }

    const cameraEl = document.querySelector('[camera]');
    const screenPosition = new THREE.Vector2();
    screenPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    screenPosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    console.log("screenPosition:", screenPosition);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenPosition, cameraEl.getObject3D('camera'));

    const distance = 3;
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.at(distance, intersectionPoint);

    const tagElement = document.querySelector(`#${Type}-entity #${Name}`);
    if (!tagElement) {
        console.error(`Élément avec ID #${Type}-entity #${Name} non trouvé.`);
        return;
    }

    tagElement.setAttribute('position', {
        x: intersectionPoint.x,
        y: intersectionPoint.y,
        z: intersectionPoint.z,
    });
    console.log(`Position mise à jour : ${intersectionPoint.x}, ${intersectionPoint.y}, ${intersectionPoint.z}`);

    const sceneSelect = document.getElementById('selectscene');
    const selectedScene = VR.scenes[sceneSelect.value];

    // Vérifier si une instance de tag existe déjà dans VR, sinon créer une nouvelle instance
    let tagInstance = VR.scenes[sceneSelect.value].tags.find(tag => tag.name === Name);
    
    if (!tagInstance) {
        // Créer une nouvelle instance si elle n'existe pas déjà
        if (Type === 'door') {
            tagInstance = new Door(Name, selectedScene);
        } else if (Type === 'text') {
            tagInstance = new Text(Name, selectedScene);
        } else if (Type === 'photo') {
            tagInstance = new Photo(Name, selectedScene);
        } else {
            console.error('Type de tag non reconnu.');
            return;
        }
    }

    // Mettre à jour la position dans l'instance du tag
    tagInstance.position = {
        x: intersectionPoint.x,
        y: intersectionPoint.y,
        z: intersectionPoint.z,
    };

    // Mettre à jour les sliders avec la nouvelle position
    document.getElementById('x-slider').value = tagInstance.position.x.toFixed(1);
    document.getElementById('y-slider').value = tagInstance.position.y.toFixed(1);
    document.getElementById('z-slider').value = tagInstance.position.z.toFixed(1);

    // Mettre à jour les valeurs des sliders affichées
    document.getElementById('x-value').textContent = tagInstance.position.x.toFixed(1);
    document.getElementById('y-value').textContent = tagInstance.position.y.toFixed(1);
    document.getElementById('z-value').textContent = tagInstance.position.z.toFixed(1);

    // Mettre à jour le dégradé des sliders
    ['x', 'y', 'z'].forEach(axis => {
        const slider = document.getElementById(`${axis}-slider`);
        const ratio = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        const activeColor = "#00C058";
        const inactiveColor = "transparent";
        slider.style.background = `linear-gradient(90deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`;
    });

    console.log(`Tag déplacé à la position : ${intersectionPoint.x}, ${intersectionPoint.y}, ${intersectionPoint.z}`);
}

// Fonction générique pour charger et instancier les tags (door, text, et photo)
export function loadTag() {
    const sceneSelect = document.getElementById('selectscene');
    const selectedScene = VR.scenes[sceneSelect.value];

    // Vide les entités existantes
    const doorEntities = document.querySelector('#door-entity');
    const textEntities = document.querySelector('#text-entity');
    const photoEntities = document.querySelector('#photo-entity');
    
    [doorEntities, textEntities, photoEntities].forEach(entityContainer => {
        while (entityContainer.firstChild) {
            entityContainer.removeChild(entityContainer.firstChild);
        }
    });

    // Parcourt tous les tags de la scène sélectionnée
    selectedScene.tags.forEach(tag => {
        // Instancie la classe appropriée selon le type de tag
        let tagInstance;
        if (tag.type === 'door') {
            tagInstance = new Door(tag.name, selectedScene);
        } else if (tag.type === 'text') {
            tagInstance = new Text(tag.name, selectedScene);
        }
        else if (tag.type === 'photo') {
            tagInstance = new Photo(tag.name, selectedScene);
        }

        // Crée l'entité correspondante à partir du tag et la classe
        const newEntity = createEntity(tag);

        // Ajoute l'entité à la scène en fonction du type
        if (tag.type === 'door') {
            doorEntities.appendChild(newEntity);
        } else if (tag.type === 'text') {
            textEntities.appendChild(newEntity);
        } else if (tag.type === 'photo') {
            photoEntities.appendChild(newEntity);
        }
    });
}

export function tagRotationChange(e, tagType) {
    const tagName = document.getElementById(`${tagType}-name`).textContent; // "door-name" ou "text-name"
    const sceneSelect = document.getElementById('selectscene');
    const selectedScene = VR.scenes[sceneSelect.value];
    const axis = e.target.name; // 'x', 'y', or 'z'
    const newRotation = parseFloat(e.target.value);
    // Mettre à jour l'affichage de la valeur du slider
    document.querySelector(`#${axis}-value`).textContent = `${newRotation}`;

    // Créer une instance de TagManager pour gérer les tags
    const tagManager = new TagManager(selectedScene);

    // Récupérer le tag actuel dans la scène
    const currentTag = selectedScene.tags.find(tag => tag.type === tagType && tag.name === tagName);
    if (!currentTag) return;

    // Mettre à jour seulement la rotation
    const updatedTag = tagManager.rotateTag(tagName, { ...currentTag.rotation, [axis]: newRotation });

    // Si le tag a été mis à jour, mettre à jour l'entité dans la scène A-Frame
    if (updatedTag) {
        const tagElement = document.querySelector(`#${tagType}-entity #${tagName}`);
        if (tagElement) {
            tagElement.setAttribute('rotation', `${updatedTag.rotation.rx} ${updatedTag.rotation.ry} ${updatedTag.rotation.rz}`);
        }

        // Mise à jour du dégradé linéaire du slider
        LoadSlider(e.target);
    }
    console.log(VR);
}