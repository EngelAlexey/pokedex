const dbName = 'PokedexDB';
const dbVersion = 2;
let db;

const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('trainers')) {
        db.createObjectStore('trainers', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('teams')) {
        db.createObjectStore('teams', { keyPath: 'id', autoIncrement: true });
    }
};

request.onerror = function(event) {
    console.error('IndexedDB error:', event.target.errorCode);
};

// *** ¡TODO LO DEMÁS VA DENTRO DE ONSUCCESS! ***
request.onsuccess = function(event) {
    db = event.target.result;
    showTrainers();

    // Listener para agregar entrenador
    document.getElementById('trainerForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value.trim();
        const sexo = document.getElementById('sexo').value;
        const residencia = document.getElementById('residencia').value.trim();
        const foto = document.getElementById('foto').value;

        // Validación de duplicados antes de agregar
        const transaction = db.transaction(['trainers'], 'readonly');
        const store = transaction.objectStore('trainers');
        let isDuplicate = false;

        store.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const currNombre = (cursor.value.nombre || '').toLowerCase().trim();
                const currResidencia = (cursor.value.residencia || '').toLowerCase().trim();
                if (
                    currNombre === nombre.toLowerCase() &&
                    currResidencia === residencia.toLowerCase()
                ) {
                    isDuplicate = true;
                    alert('¡Ya existe un entrenador con ese nombre y residencia!');
                    return;
                }
                cursor.continue();
            } else {
                if (!isDuplicate) {
                    const tx = db.transaction(['trainers'], 'readwrite');
                    const storeW = tx.objectStore('trainers');
                    const entrenador = { nombre, sexo, residencia, foto };
                    storeW.add(entrenador);
                    tx.oncomplete = function () {
                        document.getElementById('trainerForm').reset();
                        showTrainers();
                    };
                }
            }
        };
    });

    // Mostrar entrenadores en la página
function showTrainers() {
    const trainersList = document.getElementById('trainersList');
    trainersList.innerHTML = '';

    const transaction = db.transaction(['trainers'], 'readonly');
    const store = transaction.objectStore('trainers');

    store.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const { nombre, sexo, residencia, foto } = cursor.value;
            const key = cursor.key;
            trainersList.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 text-center trainer-card" style="cursor:pointer;" data-trainer-id="${key}">
                        <img src="${foto}" class="card-img-top" alt="${nombre}" style="max-height:120px;object-fit:cover;">
                        <div class="card-body">
                            <h5 class="card-title">${nombre}</h5>
                            <p class="card-text">
                                <strong>Sexo:</strong> ${sexo}<br>
                                <strong>Residencia:</strong> ${residencia}
                            </p>
                        </div>
                    </div>
                </div>
            `;
            cursor.continue();
        } else if (!trainersList.innerHTML) {
            trainersList.innerHTML = '<p class="text-muted">No hay entrenadores registrados.</p>';
        } else {
            // Asigna el evento después de renderizar todas las cards
            document.querySelectorAll('.trainer-card').forEach(card => {
                card.onclick = function () {
                    const trainerId = Number(this.getAttribute('data-trainer-id'));
                    const tx = db.transaction(['trainers'], 'readonly');
                    const store = tx.objectStore('trainers');
                    store.get(trainerId).onsuccess = function(ev) {
                        showTrainerDetailModal(ev.target.result);
                    };
                };
            });
        }
    };
}


function showTrainerDetailModal(trainer) {
    const trainerHTML = `
        <div class="text-center">
            <img src="${trainer.foto}" alt="${trainer.nombre}" class="rounded mb-3" style="width:120px; height:120px; object-fit:cover; box-shadow:0 4px 16px #0002;">
            <h4 class="mb-2">${trainer.nombre}</h4>
            <p><strong>Sexo:</strong> ${trainer.sexo}</p>
            <p><strong>Residencia:</strong> ${trainer.residencia}</p>
        </div>
    `;
    document.getElementById('trainer-detail-modal-body').innerHTML = trainerHTML;
    let modal = new bootstrap.Modal(document.getElementById('trainerDetailModal'));
    modal.show();
    }
}