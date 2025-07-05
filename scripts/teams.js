// ========== IndexedDB config ==========
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

request.onsuccess = function(event) {
    db = event.target.result;
    fillResidenceDropdown();
    loadTrainers();
    showTeams();
    fetchAllPokemons();
};

request.onerror = function(event) {
    console.error('IndexedDB error:', event.target.errorCode);
};

// ========== Residencia: Dropdown dinámico ==========
function fillResidenceDropdown() {
    const residenceSelect = document.getElementById('residenceSelect');
    residenceSelect.innerHTML = `<option value="">Selecciona una residencia</option>`;
    let uniqueResidences = [];
    const transaction = db.transaction(['trainers'], 'readonly');
    const store = transaction.objectStore('trainers');
    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const resi = (cursor.value.residencia || '').trim();
            if (resi && !uniqueResidences.includes(resi)) {
                uniqueResidences.push(resi);
            }
            cursor.continue();
        } else {
            uniqueResidences.sort((a, b) => a.localeCompare(b));
            uniqueResidences.forEach(resi => {
                residenceSelect.innerHTML += `<option value="${resi}">${resi}</option>`;
            });
        }
    };
}

// ========== Selector de entrenadores filtrado por residencia ==========
document.getElementById('residenceSelect').addEventListener('change', function() {
    loadTrainers();
});

function loadTrainers() {
    const trainerSelect = document.getElementById('teamTrainer');
    trainerSelect.innerHTML = `<option value="">Selecciona un entrenador</option>`;
    const selectedResidence = document.getElementById('residenceSelect').value;
    if (!selectedResidence) return;

    const transaction = db.transaction(['trainers'], 'readonly');
    const store = transaction.objectStore('trainers');
    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            if ((cursor.value.residencia || '') === selectedResidence) {
                trainerSelect.innerHTML += `<option value="${cursor.key}">${cursor.value.nombre}</option>`;
            }
            cursor.continue();
        }
    };
}

// ========== Selección visual de pokémon (como en respuestas previas) ==========
let selectedPokemons = [];
let allPokemons = [];
const POKEMON_LIMIT = 151;

function fetchAllPokemons(callback) {
    fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${POKEMON_LIMIT}`)
        .then(res => res.json())
        .then(data => {
            allPokemons = data.results.map((poke, idx) => ({
                id: idx + 1,
                name: poke.name.charAt(0).toUpperCase() + poke.name.slice(1),
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idx + 1}.png`
            }));
            if (callback) callback();
        });
}

document.getElementById('openPokemonModal').addEventListener('click', function() {
    if (allPokemons.length === 0) {
        fetchAllPokemons(() => {
            renderPokemonCards();
            let pokemonModal = new bootstrap.Modal(document.getElementById('pokemonModal'));
            pokemonModal.show();
        });
    } else {
        renderPokemonCards();
        let pokemonModal = new bootstrap.Modal(document.getElementById('pokemonModal'));
        pokemonModal.show();
    }
});

document.getElementById('pokemonSearch').addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    renderPokemonCards(searchText);
});

function renderPokemonCards(filter = '') {
    const pokemonList = document.getElementById('pokemonList');
    pokemonList.innerHTML = '';
    const pokemonsToShow = filter
        ? allPokemons.filter(poke => poke.name.toLowerCase().includes(filter))
        : allPokemons;

    pokemonsToShow.forEach(poke => {
        const isSelected = selectedPokemons.some(sel => sel.id === poke.id);
        pokemonList.innerHTML += `
            <div class="col-6 col-md-3 mb-2">
                <div class="card card-selectable ${isSelected ? 'border-primary border-3' : ''}" style="cursor:pointer;" data-id="${poke.id}">
                    <img src="${poke.image}" class="card-img-top" alt="${poke.name}">
                    <div class="card-body py-2 text-center">
                        <span class="card-title fw-bold">${poke.name}</span>
                        <br>
                        <span class="badge bg-secondary">#${poke.id}</span>
                    </div>
                </div>
            </div>
        `;
    });

    document.querySelectorAll('.card-selectable').forEach(card => {
        card.onclick = function() {
            const pokeId = parseInt(this.dataset.id);
            const pokeObj = allPokemons.find(p => p.id === pokeId);
            if (!pokeObj) return;
            if (selectedPokemons.some(sel => sel.id === pokeId)) {
                selectedPokemons = selectedPokemons.filter(sel => sel.id !== pokeId);
            } else if (selectedPokemons.length < 6) {
                selectedPokemons.push(pokeObj);
            }
            renderPokemonCards(filter);
            showSelectedPokemons();
            showSelectedCount();
        };
    });
    showSelectedCount();
}

function showSelectedPokemons() {
    const cont = document.getElementById('selectedPokemons');
    cont.innerHTML = '';
    selectedPokemons.forEach(poke => {
        cont.innerHTML += `
            <div class="me-2 mb-2 text-center d-inline-block">
                <img src="${poke.image}" width="50" height="50" alt="${poke.name}">
                <div class="small">${poke.name}</div>
                <button type="button" class="btn-close btn-close-sm" aria-label="Quitar" onclick="removePokemonFromSelection(${poke.id})"></button>
            </div>
        `;
    });
}

function showSelectedCount() {
    const modalTitle = document.getElementById('pokemonModalLabel');
    modalTitle.textContent = `Seleccionar Pokémon (exactamente 6) - Seleccionados: ${selectedPokemons.length}`;
}
window.removePokemonFromSelection = function(id) {
    selectedPokemons = selectedPokemons.filter(p => p.id !== id);
    showSelectedPokemons();
    renderPokemonCards(document.getElementById('pokemonSearch').value.toLowerCase());
    showSelectedCount();
}

// ========== Guardar equipo con validación de duplicados ==========
document.getElementById('teamForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('teamName').value.trim();
    const imagen = document.getElementById('teamImage').value.trim();
    const residencia = document.getElementById('residenceSelect').value;
    const entrenadorId = parseInt(document.getElementById('teamTrainer').value);

    if (!nombre) {
        alert('Debes ingresar el nombre del equipo.');
        return;
    }
    if (!imagen) {
        alert('Debes ingresar la imagen del equipo.');
        return;
    }
    if (!residencia) {
        alert('Debes seleccionar una residencia.');
        return;
    }
    if (isNaN(entrenadorId)) {
        alert('Debes seleccionar un entrenador.');
        return;
    }
    if (selectedPokemons.length !== 6) {
        alert('Debes seleccionar exactamente 6 Pokémon para el equipo.');
        return;
    }

    // Validación de duplicados por nombre (ignorando mayúsculas y espacios)
    const transaction = db.transaction(['teams'], 'readonly');
    const store = transaction.objectStore('teams');
    let isDuplicate = false;

    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const currNombre = (cursor.value.nombre || '').toLowerCase().trim();
            if (currNombre === nombre.toLowerCase()) {
                isDuplicate = true;
                alert('¡Ya existe un equipo con ese nombre!');
                return;
            }
            cursor.continue();
        } else {
            if (!isDuplicate) {
                const tx = db.transaction(['teams'], 'readwrite');
                const storeW = tx.objectStore('teams');
                const equipo = {
                    nombre,
                    imagen,
                    residencia,
                    entrenadorId,
                    pokemons: selectedPokemons
                };
                storeW.add(equipo);

                tx.oncomplete = function () {
                    document.getElementById('teamForm').reset();
                    selectedPokemons = [];
                    showSelectedPokemons();
                    fillResidenceDropdown();
                    loadTrainers();
                    setTimeout(showTeams, 100);
                    alert('¡Equipo guardado exitosamente!');
                };
                tx.onerror = function() {
                    alert('Error al guardar el equipo. Intenta nuevamente.');
                };
            }
        }
    };
});

// ========== Mostrar equipos ==========
function showTeams() {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';

    const transaction = db.transaction(['teams'], 'readonly');
    const store = transaction.objectStore('teams');

    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const { nombre, imagen, residencia, entrenadorId, pokemons } = cursor.value;
            getTrainerById(entrenadorId, function(entrenador) {
                teamsList.innerHTML += `
                    <div class="col-md-6">
                        <div class="card h-100 team-card" style="cursor:pointer;" data-team-id="${cursor.key}">
                            <img src="${imagen}" class="card-img-top" alt="${nombre}" style="max-height:180px;object-fit:cover;">
                            <div class="card-body">
                                <h5 class="card-title">${nombre}</h5>
                                <p class="card-text">
                                    <strong>Residencia:</strong> ${residencia} <br>
                                    <strong>Entrenador:</strong> ${entrenador ? entrenador.nombre : 'Desconocido'}
                                </p>
                                <div class="d-flex flex-wrap justify-content-center">
                                    ${pokemons.map(poke => `
                                        <div class="p-2 text-center">
                                            <img src="${poke.image}" width="56" height="56" alt="${poke.name}">
                                            <div class="small">${poke.name}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Asignar evento click cuando ya se agregó el HTML
                document.querySelectorAll('.team-card').forEach(card => {
                    card.onclick = function () {
                        const teamId = Number(this.getAttribute('data-team-id'));
                        // Buscar el equipo y su entrenador para pasar a la función modal
                        const tx = db.transaction(['teams'], 'readonly');
                        const st = tx.objectStore('teams');
                        st.get(teamId).onsuccess = function(ev) {
                            const teamObj = ev.target.result;
                            getTrainerById(teamObj.entrenadorId, function(entrenadorObj) {
                                showTeamDetailModal(teamObj, entrenadorObj);
                            });
                        };
                    }
                });
            });
            cursor.continue();
        } else if (!teamsList.innerHTML) {
            teamsList.innerHTML = '<p class="text-muted">No hay equipos registrados.</p>';
        }
    };
}


// ========== Obtener entrenador por ID ==========
function getTrainerById(id, callback) {
    const transaction = db.transaction(['trainers'], 'readonly');
    const store = transaction.objectStore('trainers');
    const request = store.get(id);
    request.onsuccess = function() {
        callback(request.result);
    };
}

function showTeamDetailModal(teamObj, entrenadorObj) {
    const pokemons = teamObj.pokemons || [];
    const equipoHTML = `
        <div>
            <h3 class="mb-3 text-center">${teamObj.nombre}</h3>
            <div class="row">
                <div class="col-md-4 text-center mb-3 mb-md-0">
                    <img src="${teamObj.imagen}" class="img-fluid rounded" style="max-height:170px;object-fit:cover;" alt="${teamObj.nombre}">
                    <p class="mt-3"><strong>Residencia:</strong> ${teamObj.residencia}</p>
                    <p><strong>Entrenador:</strong> ${entrenadorObj ? entrenadorObj.nombre : 'Desconocido'}</p>
                </div>
                <div class="col-md-8">
                    <h5 class="mb-2">Pokémon del equipo:</h5>
                    <div class="d-flex flex-wrap justify-content-start">
                        ${pokemons.map(poke => `
                            <div class="p-2 text-center">
                                <img src="${poke.image}" width="60" height="60" alt="${poke.name}">
                                <div class="small">${poke.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('team-detail-modal-body').innerHTML = equipoHTML;
    let modal = new bootstrap.Modal(document.getElementById('teamDetailModal'));
    modal.show();
}
