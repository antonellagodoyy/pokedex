const $containerPokemons = document.querySelector("#container-pokemons");
let nextPokemonList = null;

let controllerBusquedaAvanzada = null;
let signalBusquedaAvanzada = null;

let controllerBusquedaSimple = null;
let signalBusquedaSimple = null;

fetch("https://pokeapi.co/api/v2/pokemon/?limit=20&offset=0")
    .then((response) => response.json())
    .then((response) => {
        creaCardsPokemonsYPokemonsPorHabitat(response, "results");
        ocultaCargando();

        nextPokemonList = response["next"];
    })
    .catch((error) =>
        console.error("Fallo la carga de la lista de pokemones inicial", error)
    );

document.querySelector("#carga-pokemons").addEventListener("click", () => {
    fetch(nextPokemonList)
        .then((response) => response.json())
        .then((response) => {
            creaCardsPokemonsYPokemonsPorHabitat(response, "results");
            nextPokemonList = response["next"];
        })
        .catch((error) =>
            console.error("Fallo la carga de la siguiente lista de pokemones", error)
        );
});

document.querySelector("#carga-todos").addEventListener("click", () => {
    const pokemonesActuales = document.querySelectorAll(".card").length;
    fetch(
        `https://pokeapi.co/api/v2/pokemon/?offset=${pokemonesActuales}&limit=1000000`
    )
        .then((response) => response.json())
        .then((response) => {
            creaCardsPokemonsYPokemonsPorHabitat(response, "results");
            nextPokemonList = null;
        })
        .catch((error) =>
            console.error("Fallo la carga de todos los Pokemones", error)
        );
});

document.querySelector("#busqueda-pokemon").addEventListener("submit", (e) => {
    ocultaMensajeBusquedaFallida();
    limpiaContenedorPokemons();
    muestraCargando();

    if (controllerBusquedaAvanzada !== null) {
        controllerBusquedaAvanzada.abort();
    } else if (controllerBusquedaSimple !== null) {
        controllerBusquedaSimple.abort();
    }

    const pokemonBuscado = document.querySelector("#search-pokemon").value.trim();

    const regularExpressionNumbers = /^[0-9]+$/;

    if (pokemonBuscado === "" || pokemonBuscado === "0") {
        ocultaCargando();
        muestraMensajeBusquedaFallida();
    } else if (regularExpressionNumbers.test(pokemonBuscado)) {

        controllerBusquedaSimple = new AbortController();
        signalBusquedaSimple = controllerBusquedaSimple.signal;

        fetch(`https://pokeapi.co/api/v2/pokemon/${Number(pokemonBuscado)}`, {"signal": signalBusquedaSimple})
            .then((response) => response.json())
            .then((response) => {
                ocultaCargando();
                creaCardsPokemonsBuscados(response);
            })
            .catch((error) => {
                if (error.name !== "AbortError") {
                    ocultaCargando();
                    muestraMensajeBusquedaFallida();
                    console.error("Fallo la busqueda del Pokemon", error);
                } else {
                    console.log("Fetch busqueda simple aborted");
                }
            });
    } else {
        fetch("https://pokeapi.co/api/v2/pokemon/?offset=0&limit=10000")
            .then((response) => response.json())
            .then((response) => {
                (async () => {
                    try {
                        controllerBusquedaSimple = new AbortController();
                        signalBusquedaSimple = controllerBusquedaSimple.signal;

                        for (let i = 0; i < response["results"].length; i++) {
                            await encuentraPokemonPorBusquedaSimple(response["results"][i], pokemonBuscado, signalBusquedaSimple);
                        }
                        if ($containerPokemons.textContent === "") {
                            ocultaCargando();
                            muestraMensajeBusquedaFallida();
                        }
                    } catch (error) {
                        if (error.name !== "AbortError") {
                            console.error(
                                "Fallo la carga de la informacion basica del Pokemon buscado (busqueda simple)",
                                error
                            );
                        } else {
                            console.log("Fetch busqueda simple aborted");
                        }
                    }
                })();
            })
            .catch((error) =>
                console.error("Fallo la carga de todos los Pokemons (busqueda simple)", error)
            );
    }

    ocultaBusquedaAvanzadaForm();

    e.preventDefault();
});

async function encuentraPokemonPorBusquedaSimple(pokemon, pokemonBuscado, signalBusquedaSimple) {
    if (pokemon["name"].includes(pokemonBuscado)) {
        ocultaCargando();

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon["name"]}`, {"signal": signalBusquedaSimple});
        const infoPokemon = await response.json();

        await creaCardsPokemonsBuscados(infoPokemon);
    }
}

document
    .querySelector("#busqueda-avanzada-form")
    .addEventListener("submit", (e) => {
        ocultaMensajeBusquedaFallida();
        limpiaContenedorPokemons();
        muestraCargando();

        if (controllerBusquedaSimple !== null) {
            controllerBusquedaSimple.abort();
        } else if (controllerBusquedaAvanzada !== null) {
            controllerBusquedaAvanzada.abort();
        }

        const {
            habitatRequerido,
            abilitySelectedIndex,
            abilitySelected,
            $typesPokemonForm
        } = obtieneDatosRequeridosBusquedaAvanzada();

        fetch("https://pokeapi.co/api/v2/pokemon/?offset=0&limit=1000000")
            .then((response) => response.json())
            .then((response) => {
                (async () => {
                    try {
                        controllerBusquedaAvanzada = new AbortController();
                        signalBusquedaAvanzada = controllerBusquedaAvanzada.signal;

                        for (let i = 0; i < response["results"].length; i++) {
                            console.log($typesPokemonForm[0].value + "  " + $typesPokemonForm[0].checked);
                            console.log($typesPokemonForm[2].value + "  " + $typesPokemonForm[2].checked);
                            console.log($typesPokemonForm[4].value + "  " + $typesPokemonForm[4].checked);
                            await encuentraPokemonBusquedaAvanzada(response["results"][i], habitatRequerido, abilitySelectedIndex, abilitySelected, $typesPokemonForm, signalBusquedaAvanzada);
                        }

                        if ($containerPokemons.textContent === "") {
                            ocultaCargando();
                            muestraMensajeBusquedaFallida();
                        }
                    } catch (error) {
                        if (error.name !== "AbortError") {
                            console.error(
                                "Fallo la carga del Pokemon buscado en la busqueda avanzada",
                                error);

                            ocultaCargando();
                            muestraMensajeBusquedaFallida();
                        } else {
                            console.log("Fetch busqueda avanzada aborted");
                        }
                    }
                })();
            }).catch((error) =>
            console.error("Fallo la carga de todos los Pokemon para la busqueda avanzada.", error)
        );

        ocultaBusquedaAvanzadaForm();

        e.preventDefault();
    });

function obtieneDatosRequeridosBusquedaAvanzada() {
    const habitatRequerido = obtieneHabitatRequerido();
    const {abilitySelectedIndex, abilitySelected} = obtieneAbilityDatos();

    const $typesPokemonForm = document.querySelectorAll(
        "#busqueda-avanzada-form [name='type-pokemon']"
    );

    console.log("En funcion OBTIENEDATOSREQUERIDOSBUSQUEDAAVANZADA");

    return {habitatRequerido, abilitySelectedIndex, abilitySelected, $typesPokemonForm};
}

$containerPokemons.addEventListener("click", function (e) {
    if (e.target.classList.contains("card")) {
        const pokemonID = e.target.getAttribute("data-pokeID");
        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`)
            .then((response) => response.json())
            .then((response) => {
                muestraOverlay();
                ocultaScrollBody();
                blurPage();
                creaInfoPokemon(response);
            })
            .catch((error) =>
                console.error("Fallo la carga de la info del pokemon", error)
            );
    }
});

document.querySelector("main").addEventListener("click", function (e) {
    if (e.target.id === "close-overlay") {
        muestraScrollBody();
        unBlurPage();
        e.target.parentElement.classList.toggle("oculto");
    }
});

document.querySelector("main").addEventListener("click", function (e) {
    if (
        e.target.parentElement.name === "varieties" &&
        e.target.hasAttribute("value") &&
        e.target.value !== document.querySelector("h4").textContent
    ) {
        const pokemonNombre = e.target.getAttribute("value");
        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNombre}`)
            .then((response) => response.json())
            .then((response) => {
                muestraOverlay();
                ocultaScrollBody();
                blurPage();
                creaInfoPokemon(response);
            })
            .catch((error) =>
                console.error("Fallo la carga de la info del pokemon", error)
            );
    }
});

function creaCardsPokemonsYPokemonsPorHabitat(response, propiedadDelObjeto) {
    response[propiedadDelObjeto].forEach((pokemon) => {
        const $cardPokemon = document.createElement("div");
        const $nombrePokemon = document.createElement("p");
        const $imagenPokemon = document.createElement("div");
        const $tiposPokemon = document.createElement("div");

        $containerPokemons.appendChild($cardPokemon);
        $cardPokemon.appendChild($nombrePokemon);
        $cardPokemon.appendChild($imagenPokemon);
        $cardPokemon.appendChild($tiposPokemon);

        estableceClasesCardPokemon($cardPokemon);
        $imagenPokemon.classList.add("pokemon-image");
        $nombrePokemon.classList.add("pokemon-name");
        $tiposPokemon.classList.add("types-pokemon-container");

        $nombrePokemon.textContent = seteaTextoSinGuiones(pokemon["name"]);

        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon["name"]}`)
            .then((response) => response.json())
            .then((response) => {
                estableceImagenPokemon(response, $imagenPokemon);
                $cardPokemon.setAttribute("data-pokeID", response["id"]);

                response["types"].forEach((tipo) => {
                    creaTiposPokemonBadge($tiposPokemon, tipo);
                });
            })
            .catch((error) => console.error("Fallo la carga del pokemon", error));
    });
}

function estableceImagenPokemon(response, $imagenPokemon) {
    const pokemonImageLink = response["sprites"]["front_default"];
    if (pokemonImageLink === null) {
        const $imagenPokemonNula = document.createElement("i");
        $imagenPokemon.appendChild($imagenPokemonNula);
        $imagenPokemonNula.classList.add("nes-pokeball");
    } else {
        const imagenPokemon = document.createElement("img");
        $imagenPokemon.appendChild(imagenPokemon);
        imagenPokemon.src = `${pokemonImageLink}`;
        imagenPokemon.alt = `Image of ${response["name"]}`;
    }
}

function creaCardsPokemonsBuscados(response) {
    const $cardPokemon = document.createElement("div");
    const $nombrePokemon = document.createElement("p");
    const $imagenPokemon = document.createElement("div");
    const $tiposPokemon = document.createElement("div");

    $containerPokemons.appendChild($cardPokemon);
    $cardPokemon.appendChild($nombrePokemon);
    $cardPokemon.appendChild($imagenPokemon);
    $cardPokemon.appendChild($tiposPokemon);

    estableceClasesCardPokemon($cardPokemon);
    $imagenPokemon.classList.add("pokemon-image");
    $nombrePokemon.classList.add("pokemon-name");
    $tiposPokemon.classList.add("types-pokemon-container");

    $nombrePokemon.textContent = seteaTextoSinGuiones(response["name"]);

    estableceImagenPokemon(response, $imagenPokemon);
    $cardPokemon.setAttribute("data-pokeID", response["id"]);

    response["types"].forEach((tipo) => {
        creaTiposPokemonBadge($tiposPokemon, tipo);
    });
}

function creaCardsPokemonsPorTipoYHabilidad(response, propiedadDelObjeto) {
    response[propiedadDelObjeto].forEach((pokemon) => {
        const $cardPokemon = document.createElement("div");
        const $nombrePokemon = document.createElement("p");
        const $imagenPokemon = document.createElement("div");
        const $tiposPokemon = document.createElement("div");

        $containerPokemons.appendChild($cardPokemon);
        $cardPokemon.appendChild($nombrePokemon);
        $cardPokemon.appendChild($imagenPokemon);
        $cardPokemon.appendChild($tiposPokemon);

        estableceClasesCardPokemon($cardPokemon);
        $imagenPokemon.classList.add("pokemon-image");
        $nombrePokemon.classList.add("pokemon-name");
        $tiposPokemon.classList.add("types-pokemon-container");

        $nombrePokemon.textContent = seteaTextoSinGuiones(pokemon["pokemon"]["name"]);

        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon["pokemon"]["name"]}`)
            .then((response) => response.json())
            .then((response) => {
                estableceImagenPokemon(response, $imagenPokemon);
                $cardPokemon.setAttribute("data-pokeID", response["id"]);

                response["types"].forEach((tipo) => {
                    creaTiposPokemonBadge($tiposPokemon, tipo);
                });
            })
            .catch((error) => console.error("Fallo la carga del pokemon", error));
    });
}

function muestraOverlay() {
    document.querySelector("#overlay").classList.remove("oculto");

    const $iconoCerrarOverlay = document
        .querySelector("#overlay")
        .removeChild(document.querySelector("#close-overlay"));
    document.querySelector("#overlay").textContent = "";

    const $headerOverlay = document.createElement("header");
    $headerOverlay.id = "header-overlay";

    document.querySelector("#overlay").appendChild($headerOverlay);
    document.querySelector("#overlay").appendChild($iconoCerrarOverlay);
}

function ocultaOverlay() {
    document.querySelector("#overlay").classList.add("oculto");
}

function creaInfoPokemon(response) {
    creaNombrePokemon(response);
    creaIDPokemon(response);
    creaVariedadesPokemon(response);
    creaImagenPokemon(response);
    creaTiposPokemon(response);
    creaContainerPesoAlturaYHabitat();
    creaAlturaPokemon(response);
    creaPesoPokemon(response);
    creaHabitatPokemon(response);
    putSeparationBar();
    creaDescripcionPokemon(response);
    putSeparationBar();
    creaDamageStatsPokemon(response);
    putSeparationBar();
    creaStatsPokemon(response);
    putSeparationBar();
    creaHabilidadesPokemon(response);
    putSeparationBar();
    creaCadenaEvolutivaPokemon(response);
}

function creaNombrePokemon(response) {
    const $nombrePokemon = document.createElement("h4");

    document.querySelector("#overlay").appendChild($nombrePokemon);

    $nombrePokemon.classList.add("pokemon-name");
    $nombrePokemon.textContent = response["name"];
}

function creaIDPokemon(response) {
    const $IDPokemon = document.createElement("p");

    document.querySelector("#overlay").appendChild($IDPokemon);
    $IDPokemon.classList.add("id-pokemon");

    $IDPokemon.textContent = `No. ${response["id"]}`;
}

function creaVariedadesPokemon(response) {
    const $variedadesPokemonContainer = document.createElement("div");
    const $variedadesPokemon = document.createElement("select");

    document.querySelector("#overlay").appendChild($variedadesPokemonContainer);
    $variedadesPokemonContainer.appendChild($variedadesPokemon);

    $variedadesPokemonContainer.classList.add("nes-select", "is-dark", "varieties-container");

    fetch(response["species"]["url"])
        .then((response) => response.json())
        .then((response) => {
            $variedadesPokemon.name = "varieties";

            response["varieties"].forEach((variety, index) => {
                const $variedadNombre = document.createElement("option");

                $variedadesPokemon.appendChild($variedadNombre);

                $variedadNombre.value = response["varieties"][index]["pokemon"]["name"];
                $variedadNombre.textContent =
                    response["varieties"][index]["pokemon"]["name"];
            });

            for (let i = 0; i < $variedadesPokemon.length; i++) {
                if (
                    $variedadesPokemon.options[i].text ===
                    document.querySelector("#overlay h4").textContent
                ) {
                    $variedadesPokemon.options[i].selected = true;
                }
            }
        });
}

function creaDescripcionPokemon(response) {
    const $descripcionPokemon = document.createElement("p");

    document.querySelector("#overlay").appendChild($descripcionPokemon);
    $descripcionPokemon.classList.add("description-pokemon-container");

    fetch(response["species"]["url"])
        .then((response) => response.json())
        .then((response) => {
            let descripcionEncontrada = false;

            while (descripcionEncontrada === false) {
                let numeroAleatorio = Math.floor(
                    Math.random() * response["flavor_text_entries"].length
                );
                if (
                    response["flavor_text_entries"][numeroAleatorio]["language"][
                        "name"
                        ] === "en"
                ) {
                    $descripcionPokemon.textContent =
                        response["flavor_text_entries"][numeroAleatorio]["flavor_text"];
                    descripcionEncontrada = true;
                }
            }
        });
}

function creaImagenPokemon(response) {
    const $imagenPokemon = document.createElement("div");

    document.querySelector("#overlay").appendChild($imagenPokemon);

    $imagenPokemon.classList.add("pokemon-image");
    estableceImagenPokemon(response, $imagenPokemon);
}

function creaContainerPesoAlturaYHabitat () {
    const $container = document.createElement("div");
    $container.classList.add("weight-height-habitat-container");
    document.querySelector("#overlay").appendChild($container);
}

function creaPesoPokemon(response) {
    const $pesoPokemonContainer = document.createElement("div");
    const $pesoPokemon = document.createElement("p");

    document.querySelector(".weight-height-habitat-container").appendChild($pesoPokemonContainer);
    $pesoPokemonContainer.appendChild($pesoPokemon);

    $pesoPokemonContainer.classList.add("weight-pokemon-container");
    seteaNumeroDecimal(response, "weight", $pesoPokemon, "kg", "WT");
}

function creaAlturaPokemon(response) {
    const $alturaPokemonContainer = document.createElement("div");
    const $alturaPokemon = document.createElement("p");

    document.querySelector(".weight-height-habitat-container").appendChild($alturaPokemonContainer);
    $alturaPokemonContainer.appendChild($alturaPokemon);

    $alturaPokemonContainer.classList.add("height-pokemon-container");
    seteaNumeroDecimal(response, "height", $alturaPokemon, "m", "HT");
}

function seteaNumeroDecimal(response, propiedadString, $propiedad, unidad, abreviacion) {
    if (String(response[propiedadString]).length === 1) {
        $propiedad.textContent = `${abreviacion} 0.${response[propiedadString]} ${unidad}`;
    } else if (String(response[propiedadString]).length === 2) {
        $propiedad.textContent = `${abreviacion} ${String(response[propiedadString])[0]}.${
            String(response[propiedadString])[1]
        } ${unidad}`;
    } else if (String(response[propiedadString]).length === 3) {
        $propiedad.textContent = `${abreviacion} ${String(response[propiedadString])[0]}${
            String(response[propiedadString])[1]
        }.${String(response[propiedadString])[2]} ${unidad}`;
    } else if (String(response[propiedadString]).length === 4) {
        $propiedad.textContent = `${abreviacion} ${String(response[propiedadString])[0]}${
            String(response[propiedadString])[1]
        }${String(response[propiedadString])[2]}.${
            String(response[propiedadString])[3]
        } ${unidad}`;
    } else if (String(response[propiedadString]).length === 5) {
        $propiedad.textContent = `${abreviacion} ${String(response[propiedadString])[0]}${
            String(response[propiedadString])[1]
        }${String(response[propiedadString])[2]}${
            String(response[propiedadString])[3]
        }.${String(response[propiedadString])[4]} ${unidad}`;
    }
}

function creaTiposPokemon(response) {
    const $tiposPokemon = document.createElement("div");

    document.querySelector("#overlay").appendChild($tiposPokemon);

    $tiposPokemon.classList.add("types-pokemon-container");

    response["types"].forEach((tipo) => {
        creaTiposPokemonBadge($tiposPokemon, tipo);
    });
}

function creaDamageStatsPokemon(response) {
    const $damageStatsContainer = document.createElement("div");
    const $titleDamageContainer = document.createElement("p");
    const $statsContainer = document.createElement("div");
    const $damageFromContainer = document.createElement("div");
    const $titleDamageFromContainer = document.createElement("p");
    const $damageToContainer = document.createElement("div");
    const $titleDamageToContainer = document.createElement("p");

    $damageStatsContainer.classList.add("damage-stats-container");
    $titleDamageContainer.textContent = "DAMAGE STATS";
    $titleDamageFromContainer.textContent = "From";
    $titleDamageToContainer.textContent = "To";
    $statsContainer.classList.add("damage-stats-container-inner");
    $damageFromContainer.id = "damage-from-container";
    $damageToContainer.id = "damage-to-container";

    document.querySelector("#overlay").appendChild($damageStatsContainer);
    $damageStatsContainer.appendChild($titleDamageContainer);
    $damageStatsContainer.appendChild($statsContainer);
    $statsContainer.appendChild($damageFromContainer);
    $statsContainer.appendChild($damageToContainer);
    $damageFromContainer.appendChild($titleDamageFromContainer);
    $damageToContainer.appendChild($titleDamageToContainer);

    response["types"].forEach((tipo) => {
        fetch(tipo["type"]["url"])
            .then((response) => response.json())
            .then((response) => {
                creaStat(response, $damageFromContainer, "double_damage_from", 2);
                creaStat(response, $damageFromContainer, "half_damage_from", 1);
                creaStat(response, $damageFromContainer, "no_damage_from", 0);
                creaStat(response, $damageToContainer, "double_damage_to", 2);
                creaStat(response, $damageToContainer, "half_damage_to", 1);
                creaStat(response, $damageToContainer, "no_damage_to", 0);
                ordenaStats("#damage-from-container");
                ordenaStats("#damage-to-container");
            })
            .catch((error) =>
                console.error("Fallo la carga del tipo del Pokemon", error)
            );
    });
}

function creaStat(response, container, propiedad, cantidadDamage) {
    if (response["damage_relations"][propiedad].length !== 0) {
        response["damage_relations"][propiedad].forEach((tipo) => {
            if (propiedad.includes("from")) {
                if (document.querySelector(`#damage_from_${tipo["name"]}`) != null) {
                    const amountDamage = document.querySelector(
                        `#damage_from_${tipo["name"]} .amount-damage`
                    ).textContent;
                    const numberDamage = Number(amountDamage.split("x")[1]);
                    document.querySelector(
                        `#damage_from_${tipo["name"]} .amount-damage`
                    ).textContent = `x${numberDamage + cantidadDamage}`;
                } else {
                    const $statDamageContainer = document.createElement("div");
                    const $tipoPokemon = document.createElement("a");
                    const $textoTipoPokemon = document.createElement("span");
                    const $statCantidad = document.createElement("p");

                    container.appendChild($statDamageContainer);
                    $statDamageContainer.appendChild($tipoPokemon);
                    $statDamageContainer.appendChild($statCantidad);
                    $tipoPokemon.appendChild($textoTipoPokemon);

                    $statDamageContainer.id = `damage_from_${tipo["name"]}`;
                    $tipoPokemon.classList.add("type-pokemon", "nes-badge");
                    $textoTipoPokemon.classList.add("type-pokemon-color");
                    $textoTipoPokemon.textContent = tipo["name"];
                    $statCantidad.textContent = `x${cantidadDamage}`;
                    $statCantidad.classList.add("amount-damage");
                }
            }
            if (propiedad.includes("to")) {
                if (document.querySelector(`#damage_to_${tipo["name"]}`) != null) {
                    const amountDamage = document.querySelector(
                        `#damage_to_${tipo["name"]} .amount-damage`
                    ).textContent;
                    const numberDamage = Number(amountDamage.split("x")[1]);
                    document.querySelector(
                        `#damage_to_${tipo["name"]} .amount-damage`
                    ).textContent = `x${numberDamage + cantidadDamage}`;
                } else {
                    const $statDamageContainer = document.createElement("div");
                    const $tipoPokemon = document.createElement("a");
                    const $textoTipoPokemon = document.createElement("span");
                    const $statCantidad = document.createElement("p");
                    container.appendChild($statDamageContainer);
                    $statDamageContainer.appendChild($tipoPokemon);
                    $statDamageContainer.appendChild($statCantidad);
                    $tipoPokemon.appendChild($textoTipoPokemon);

                    $statDamageContainer.id = `damage_to_${tipo["name"]}`;
                    $tipoPokemon.classList.add("type-pokemon", "nes-badge");
                    $textoTipoPokemon.classList.add("type-pokemon-color");
                    $textoTipoPokemon.textContent = tipo["name"];
                    $statCantidad.textContent = `x${cantidadDamage}`;
                    $statCantidad.classList.add("amount-damage");
                }
            }
        });
    }
}

function ordenaStats(container) {
    const nodeList = document.querySelector(container).childNodes;
    let n = nodeList.length;
    let sen = 0;
    let aux;
    let auxID;

    while (sen === 0) {
        sen = 1;
        for (let i = 0; i < n - 1; i++) {
            if (
                Number(nodeList[i].lastChild.textContent.split("x")[1]) <
                Number(nodeList[i + 1].lastChild.textContent.split("x")[1])
            ) {
                sen = 0;
                aux = nodeList[i].innerHTML;
                auxID = nodeList[i].id;
                nodeList[i].innerHTML = nodeList[i + 1].innerHTML;
                nodeList[i].id = nodeList[i + 1].id;
                nodeList[i + 1].innerHTML = aux;
                nodeList[i + 1].id = auxID;
            }
        }
        n--;
    }
}

function creaHabitatPokemon(response) {
    const $habitatPokemonContainer = document.createElement("div");
    const $habitatPokemonTitle = document.createElement("p");
    const $habitatPokemon = document.createElement("a");

    document.querySelector(".weight-height-habitat-container").appendChild($habitatPokemonContainer);
    $habitatPokemonContainer.appendChild($habitatPokemonTitle);
    $habitatPokemonContainer.appendChild($habitatPokemon);

    $habitatPokemonContainer.classList.add("habitat-pokemon-container");
    $habitatPokemonTitle.textContent = "HABITAT:";
    $habitatPokemon.classList.add("habitat-pokemon");

    fetch(response["species"]["url"])
        .then((response) => response.json())
        .then((response) => {
            try {
                $habitatPokemon.textContent = response["habitat"]["name"];
            } catch {
                $habitatPokemon.textContent = "unknown";
            }
        })
        .catch((error) =>
            console.error("Fallo la carga de la especie del pokemon", error)
        );
}

function creaHabilidadesPokemon(response) {
    const $habilidadesPokemon = document.createElement("div");
    const $habiidadesPokemonTitle = document.createElement("p");

    document.querySelector("#overlay").appendChild($habilidadesPokemon);
    $habilidadesPokemon.appendChild($habiidadesPokemonTitle);

    $habilidadesPokemon.classList.add("abilities-pokemon-container");
    $habiidadesPokemonTitle.textContent = "ABILITIES";

    response["abilities"].forEach((habilidad) => {
        const $habilidadPokemon = document.createElement("div");
        const $habilidadNombre = document.createElement("p");
        const $iconoInfoHabilidad = document.createElement("img");

        $habilidadesPokemon.appendChild($habilidadPokemon);
        $habilidadPokemon.appendChild($habilidadNombre);
        $habilidadPokemon.appendChild($iconoInfoHabilidad);

        $habilidadPokemon.classList.add("ability-container");
        $habilidadNombre.textContent = habilidad["ability"]["name"];
        $habilidadNombre.classList.add("ability-pokemon");
        $iconoInfoHabilidad.classList.add("icono-info-habilidad");
        $iconoInfoHabilidad.id = $habilidadNombre.textContent;
        $iconoInfoHabilidad.src = "assets/infoIcon.png";
        $iconoInfoHabilidad.alt = "Button to see the description of the ability.";
    });

    document
        .querySelector(".abilities-pokemon-container")
        .addEventListener("click", function (e) {
            if (e.target.classList.contains("icono-info-habilidad")) {
                fetch(`https://pokeapi.co/api/v2/ability/${e.target.id}/`)
                    .then((response) => response.json())
                    .then((response) => {

                        if (document.querySelector(".abilities-pokemon-overlay") === null) {
                            const $habilidadesPokemonOverlay = document.createElement("div");

                            $habilidadesPokemonOverlay.innerHTML = "";

                            const $iconoCerrarHabilidad = document.createElement("img");
                            const $habilidadNombre = document.createElement("p");
                            const $habilidadDescripcion = document.createElement("p");

                            document
                                .querySelector(".abilities-pokemon-container")
                                .appendChild($habilidadesPokemonOverlay);
                            $habilidadesPokemonOverlay.appendChild($iconoCerrarHabilidad);
                            $habilidadesPokemonOverlay.appendChild($habilidadNombre);
                            $habilidadesPokemonOverlay.appendChild($habilidadDescripcion);

                            $habilidadesPokemonOverlay.classList.add("abilities-pokemon-overlay");
                            $iconoCerrarHabilidad.classList.add("close-overlay-ability");
                            $iconoCerrarHabilidad.src = "assets/closeIcon.png";
                            $iconoCerrarHabilidad.alt = "Button to close the ability's information";
                            $habilidadNombre.textContent = e.target.id;
                            $habilidadNombre.classList.add("ability-pokemon");

                            if (response["effect_entries"][0]["language"]["name"] === "en") {
                                $habilidadDescripcion.textContent =
                                    response["effect_entries"][0]["effect"];
                            } else {
                                $habilidadDescripcion.textContent =
                                    response["effect_entries"][1]["effect"];
                            }

                            document.querySelector('.abilities-pokemon-container').style.height = $habilidadesPokemonOverlay.clientHeight + 'px';
                        }
                    })
                    .catch((error) =>
                        console.error(
                            "Fallo la carga de la descripcion de la habilidad del Pokemon",
                            error
                        )
                    );
            }
        });
}

document.querySelector("main").addEventListener("click", e => {
    if (e.target.classList.contains("close-overlay-ability")) {
        document.querySelector(".abilities-pokemon-container").removeChild(document.querySelector(".abilities-pokemon-overlay"));

        document.querySelector('.abilities-pokemon-container').style.height = "min-content";
    }
});

function creaStatsPokemon(response) {
    const $statsPokemon = document.createElement("div");
    const $statsPokemonTitle = document.createElement("p");

    document.querySelector("#overlay").appendChild($statsPokemon);
    $statsPokemon.appendChild($statsPokemonTitle);

    $statsPokemon.classList.add("stats-pokemon-container");
    $statsPokemonTitle.textContent = "STATS";

    response["stats"].forEach((stat, index) => {
        const $statPokemon = document.createElement("div");
        const $statDescripcion = document.createElement("p");

        $statsPokemon.appendChild($statPokemon);
        $statPokemon.appendChild($statDescripcion);

        $statDescripcion.textContent = `${response["stats"][index]["stat"]["name"].toUpperCase()}: ${response["stats"][index]["base_stat"]}/100`;
        $statPokemon.classList.add("stat-pokemon");
    });
}

function creaCadenaEvolutivaPokemon(response) {
    fetch(response["species"]["url"])
        .then((response) => response.json())
        .then((response) => {
            fetch(response["evolution_chain"]["url"])
                .then((response) => response.json())
                .then((response) => {
                    const $cadenaEvolutivaContainer = document.createElement("div");
                    const $tituloCadenaEvolutiva = document.createElement("p");
                    const $cadenaEvolutiva = document.createElement("div");

                    document
                        .querySelector("#overlay")
                        .appendChild($cadenaEvolutivaContainer);
                    $cadenaEvolutivaContainer.appendChild($tituloCadenaEvolutiva);
                    $cadenaEvolutivaContainer.appendChild($cadenaEvolutiva);

                    $cadenaEvolutivaContainer.classList.add("evolution-container");
                    $tituloCadenaEvolutiva.textContent = "EVOLUTION CHAIN";

                    let eslabonEvolucion = response["chain"]["evolves_to"];
                    let eslabonNombre = response["chain"]["species"]["name"];

                    const $eslabonPokemon = document.createElement("div");
                    const $eslabonPokemonNombre = document.createElement("p");

                    $cadenaEvolutiva.appendChild($eslabonPokemon);
                    $cadenaEvolutiva.appendChild($eslabonPokemonNombre);

                    $eslabonPokemon.classList.add("pokemon-image");
                    $eslabonPokemonNombre.textContent = eslabonNombre;

                    fetch(`https://pokeapi.co/api/v2/pokemon/${eslabonNombre}`)
                        .then((response) => response.json())
                        .then((response) => {
                           estableceImagenPokemon(response, $eslabonPokemon);
                        })
                        .catch((error) =>
                            console.error("Fallo la carga de la info del pokemon", error)
                        );

                    putArrow($cadenaEvolutiva);

                    while (eslabonEvolucion && eslabonEvolucion != 0) {
                        eslabonNombre = eslabonEvolucion["0"]["species"]["name"];
                        eslabonEvolucion = eslabonEvolucion["0"]["evolves_to"];

                        const $eslabonPokemon = document.createElement("div");
                        const $eslabonPokemonNombre = document.createElement("p");

                        $cadenaEvolutiva.appendChild($eslabonPokemon);
                        $cadenaEvolutiva.appendChild($eslabonPokemonNombre);

                        $eslabonPokemon.classList.add("pokemon-image");
                        $eslabonPokemonNombre.textContent = eslabonNombre;

                        fetch(`https://pokeapi.co/api/v2/pokemon/${eslabonNombre}`)
                            .then((response) => response.json())
                            .then((response) => {
                                estableceImagenPokemon(response, $eslabonPokemon);
                            })
                            .catch((error) =>
                                console.error("Fallo la carga de la info del pokemon", error)
                            );

                        putArrow($cadenaEvolutiva);
                    }
                    document.querySelector(".evolution-container").lastElementChild.lastElementChild.style.display = "none"; /* Delete last arrow */

                })
                .catch((error) =>
                    console.error(
                        "Fallo la carga de la cadena evolutiva del Pokemon",
                        error
                    )
                );
        })
        .catch((error) =>
            console.error("Fallo la carga de los datos de especie del Pokemon", error)
        );
}

function putArrow($container) {
    const $arrow = document.createElement("img");

    $container.appendChild($arrow);

    $arrow.src = "assets/arrowDown.png";
    $arrow.alt = "Image of an arrow pointing down";
    $arrow.classList.add("arrow-down");
}

document.querySelector("main").addEventListener("click", (e) => {
    if (e.target.classList.contains("eslabon-pokemon")) {
        fetch(`https://pokeapi.co/api/v2/pokemon/${e.target.textContent}`)
            .then((response) => response.json())
            .then((response) => {
                muestraOverlay();
                ocultaScrollBody();
                blurPage();
                creaInfoPokemon(response);
            })
            .catch((error) =>
                console.error("Fallo la carga de la info del Pokemon", error)
            );
    }
});

document.querySelector("main").addEventListener("click", (e) => {
    if (e.target.classList.contains("habitat-pokemon")) {
        ocultaBusquedaAvanzadaForm();
        ocultaMensajeBusquedaFallida();
        limpiaContenedorPokemons();
        muestraCargando();
        muestraScrollBody();
        unBlurPage();
        ocultaOverlay();

        if (e.target.textContent === "unknown") {
            ocultaCargando();
            $containerPokemons.textContent = "Ups. There're not Pokemons in that habitat. Try again with another" +
                " habitat!";
        } else {
            fetch(`https://pokeapi.co/api/v2/pokemon-habitat/${e.target.textContent.toLowerCase()}`)
                .then((response) => response.json())
                .then((response) => {
                    ocultaCargando();
                    creaCardsPokemonsYPokemonsPorHabitat(response, "pokemon_species");
                })
                .catch((error) =>
                    console.error(
                        `Fallo la carga de la info basica de los Pokemons de habitat ${e.target.textContent}`,
                        error
                    )
                );
        }
    }
});

document.querySelector("main").addEventListener("click", (e) => {
    if (e.target.classList.contains("type-pokemon")) {
        ocultaBusquedaAvanzadaForm();
        limpiaContenedorPokemons();
        muestraCargando();
        muestraScrollBody();
        unBlurPage();
        ocultaOverlay();
        fetch(
            `https://pokeapi.co/api/v2/type/${e.target.textContent.toLowerCase()}`
        )
            .then((response) => response.json())
            .then((response) => {
                ocultaCargando();
                creaCardsPokemonsPorTipoYHabilidad(response, "pokemon");
            })
            .catch((error) =>
                console.error(
                    `Fallo la carga de los Pokemones de tipo ${e.target.textContent}`,
                    error
                )
            );
    }
});

document.querySelector("main").addEventListener("click", (e) => {
    if (e.target.classList.contains("ability-pokemon")) {
        ocultaOverlay();
        ocultaBusquedaAvanzadaForm();
        ocultaMensajeBusquedaFallida();
        limpiaContenedorPokemons();
        muestraScrollBody();
        unBlurPage();
        muestraCargando();
        fetch(
            `https://pokeapi.co/api/v2/ability/${e.target.textContent.toLowerCase()}`
        )
            .then((response) => response.json())
            .then((response) => {
                ocultaCargando();
                creaCardsPokemonsPorTipoYHabilidad(response, "pokemon");
            })
            .catch((error) =>
                console.error(
                    `Fallo la carga de los Pokemones que tienen la habilidad ${e.target.textContent}`,
                    error
                )
            );
    }
});

window.addEventListener("load", (e) => {
    fetch("https://pokeapi.co/api/v2/type")
        .then((response) => response.json())
        .then((response) => {
            creaBusquedaPorTipo(response);
        })
        .catch((error) =>
            console.error("Fallo la carga de los tipos de Pokemon", error)
        );

    fetch("https://pokeapi.co/api/v2/ability/?offset=0&limit=500")
        .then((response) => response.json())
        .then((response) => {
            creaBusquedaPorHabilidad(response);
        })
        .catch((error) =>
            console.error(
                "Fallo la carga de la lista de habilidades de los Pokemon",
                error
            )
        );

    fetch("https://pokeapi.co/api/v2/pokemon-habitat")
        .then((response) => response.json())
        .then((response) => {
            creaBusquedaPorHabitat(response);
        })
        .catch((error) =>
            console.error("Fallo la carga de los habitat de los Pokemon", error)
        );
});

function creaBusquedaPorTipo(response) {
    response["results"].forEach((tipo) => {
        const $tipoPokemonLabel = document.createElement("label");
        const $tipoPokemonCheckbox = document.createElement("input");
        const $tipoPokemonSpan = document.createElement("span");

        $tipoPokemonLabel.appendChild($tipoPokemonCheckbox);
        $tipoPokemonLabel.appendChild($tipoPokemonSpan);

        $tipoPokemonSpan.textContent = tipo["name"];
        $tipoPokemonCheckbox.setAttribute("type", "checkbox");
        $tipoPokemonCheckbox.setAttribute("name", "type-pokemon");
        $tipoPokemonCheckbox.setAttribute("id", tipo["name"]);
        $tipoPokemonCheckbox.setAttribute("value", tipo["name"]);
        $tipoPokemonCheckbox.classList.add("nes-checkbox", "is-dark");

        document.querySelector("#types-pokemon-container").appendChild($tipoPokemonLabel);
    });
}

function creaBusquedaPorHabilidad(response) {
    const $selectContainer = document.createElement("div");
    const $selectLabel = document.createElement("label");
    const $selectHabilidad = document.createElement("select");

    document.querySelector("#abilities-pokemon").appendChild($selectLabel);
    document.querySelector("#abilities-pokemon").appendChild($selectContainer);
    $selectContainer.appendChild($selectHabilidad);

    $selectContainer.classList.add("nes-select", "is-dark");
    $selectHabilidad.setAttribute("name", "abilities-pokemon");
    $selectHabilidad.setAttribute("id", "abilities");
    $selectHabilidad.id = "abilities";
    $selectLabel.setAttribute("for", "abilities");
    $selectLabel.textContent = "Select an ability:";


    const $abilityOption = document.createElement("option");
    $abilityOption.textContent = "----";
    $selectHabilidad.appendChild($abilityOption);

    response["results"].forEach((ability) => {
        const $abilityOption = document.createElement("option");

        $abilityOption.setAttribute("value", ability["name"]);
        $abilityOption.textContent = seteaTextoSinGuiones(ability["name"]);

        $selectHabilidad.appendChild($abilityOption);
    });
}

function creaBusquedaPorHabitat(response) {
    response["results"].forEach((habitat) => {
        const $habitatPokemonLabel = document.createElement("label");
        const $habitatPokemonRadio = document.createElement("input");
        const $habitatPokemonSpan = document.createElement("span");

        $habitatPokemonLabel.appendChild($habitatPokemonRadio);
        $habitatPokemonLabel.appendChild($habitatPokemonSpan);

        $habitatPokemonSpan.textContent = seteaTextoSinGuiones(habitat["name"]);
        $habitatPokemonRadio.setAttribute("type", "radio");
        $habitatPokemonRadio.setAttribute("name", "habitat-pokemon");
        $habitatPokemonRadio.setAttribute("id", habitat["name"]);
        $habitatPokemonRadio.setAttribute("value", habitat["name"]);
        $habitatPokemonRadio.classList.add("nes-radio", "is-dark");

        document
            .querySelector("#habitats-pokemon-container")
            .appendChild($habitatPokemonLabel);

        document.querySelector("#habitats-pokemon-container #none").checked = true;
    });
}

document
    .querySelector("#busqueda-avanzada-titulo")
    .addEventListener("click", (e) => {
        if (document
            .querySelector("#busqueda-avanzada-form").classList.contains("oculto")) {
            muestraBusquedaAvanzadaForm();
        } else if (document
            .querySelector("#busqueda-avanzada-form").classList.contains("visible")) {
            ocultaBusquedaAvanzadaForm();
        }
    });


function limpiaContenedorPokemons() {
    $containerPokemons.innerHTML = "";
    document.querySelector("#carga-pokemons").classList = "oculto";
    document.querySelector("#carga-todos").classList = "oculto";
}

async function encuentraPokemonBusquedaAvanzada(pokemon, habitatRequerido, abilitySelectedIndex, abilitySelected, $typesPokemonForm, signalBusquedaAvanzada) {
    let typesRequeridos = 0;
    let typesCoincidentes = 0;

    $typesPokemonForm.forEach((typesPokemon) => {
        if (typesPokemon.checked === true) {
            typesRequeridos++;
        }
    });

    const response = await fetch(pokemon["url"], {"signal": signalBusquedaAvanzada});
    const pokemonInfo = await response.json();

    if (typesRequeridos > 2) {
        throw new Error("A Pokemon can have only 2 or less types.");
    }

    for (let i = 0; i < $typesPokemonForm.length; i++) {
        if ($typesPokemonForm[i].checked === true) {
            const condicion = $typesPokemonForm[i].value;

            for (let j = 0; j < pokemonInfo["types"].length; j++) {
                if (pokemonInfo["types"][j]["type"]["name"] === condicion) {
                    typesCoincidentes++;
                    break;
                }
            }
        }
        if (typesCoincidentes === typesRequeridos) {
            if (
                abilitySelectedIndex === 0 ||
                abilitySelectedIndex === -1
            ) {
                if (habitatRequerido === "none") {
                    ocultaCargando();
                    creaCardsPokemonsBuscados(pokemonInfo);
                } else {
                    fetch(pokemonInfo["species"]["url"])
                        .then((response2) => response2.json())
                        .then((response2) => {
                            if (
                                habitatRequerido === response2["habitat"]["name"]
                            ) {
                                ocultaCargando();
                                creaCardsPokemonsBuscados(pokemonInfo);
                            }
                        })
                        .catch((error) =>
                            console.error(
                                "Fallo la carga de la especie del Pokemon (verificar si coincide el habitat requerido con la especie)",
                                error
                            )
                        );
                }
            } else {
                for (let x = 0; x < pokemonInfo["abilities"].length; x++) {
                    if (
                        pokemonInfo["abilities"][x]["ability"]["name"] ===
                        abilitySelected
                    ) {
                        if (habitatRequerido === "none") {
                            ocultaCargando();
                            creaCardsPokemonsBuscados(pokemonInfo);
                        } else {
                            fetch(response["species"]["url"])
                                .then((response2) => response2.json())
                                .then((response2) => {
                                    if (
                                        habitatRequerido ===
                                        response2["habitat"]["name"]
                                    ) {
                                        ocultaCargando();
                                        creaCardsPokemonsBuscados(pokemonInfo);
                                    }
                                })
                                .catch((error) =>
                                    console.error(
                                        "Fallo la carga de la especie del Pokemon (verificar si coincide el habitat requerido con la especie)",
                                        error
                                    )
                                );
                        }

                        break;
                    }
                }
            }
            break;
        }
    }
}

function obtieneHabitatRequerido() {
    let habitatRequerido;

    const $habitatsPokemonForm = document.querySelectorAll(
        "#busqueda-avanzada-form [name='habitat-pokemon']"
    );

    $habitatsPokemonForm.forEach((habitatPokemon) => {
        if (habitatPokemon.checked === true) {
            habitatRequerido = habitatPokemon.value;
        }
    });

    return habitatRequerido;
}

function obtieneAbilityDatos() {
    const $abilitiesPokemon = document.querySelector(
        "#busqueda-avanzada-form [name=\"abilities-pokemon\"]"
    );

    const abilitySelectedIndex = $abilitiesPokemon.selectedIndex;
    const abilitySelected = $abilitiesPokemon[abilitySelectedIndex].value;

    return {abilitySelectedIndex, abilitySelected};
}

function muestraCargando() {
    document.querySelector("#cargando").classList.remove("oculto");
}

function ocultaCargando() {
    document.querySelector("#cargando").classList.add("oculto");
}

function estableceClasesCardPokemon($cardPokemon) {
    $cardPokemon.classList.add("card", "nes-container", "is-dark", "is-rounded", "nes-pointer");
}

function creaTiposPokemonBadge($tiposPokemon, tipo) {
    const $tipoPokemon = document.createElement("a");
    const $textoTipoPokemon = document.createElement("span");

    $tiposPokemon.appendChild($tipoPokemon);
    $tipoPokemon.appendChild($textoTipoPokemon);

    $tipoPokemon.classList.add("type-pokemon", "nes-badge");
    $textoTipoPokemon.textContent = tipo["type"]["name"];
    $textoTipoPokemon.classList.add(`type-pokemon-color`);
}

function seteaTextoSinGuiones(string) {
    let indexGuion = string.indexOf("-");

    while (indexGuion !== -1) {

        const firstPart = string.slice(0, indexGuion);
        const secondPart = string.slice(indexGuion + 1, string.length);

        string = `${firstPart} ${secondPart}`;

        indexGuion = string.indexOf("-");
    }
    return string;
}

function ocultaBusquedaAvanzadaForm() {
    document
        .querySelector("#busqueda-avanzada-form")
        .classList.remove("visible");
    document
        .querySelector("#busqueda-avanzada-form")
        .classList.add("oculto");

    document.querySelector("#busqueda-avanzada-titulo .arrow").classList.remove("up");
    document.querySelector("#busqueda-avanzada-titulo .arrow").classList.add("down");
}

function muestraBusquedaAvanzadaForm() {
    document
        .querySelector("#busqueda-avanzada-form").classList.remove("oculto");
    document
        .querySelector("#busqueda-avanzada-form").classList.add("visible");

    document.querySelector("#busqueda-avanzada-titulo .arrow").classList.remove("down");
    document.querySelector("#busqueda-avanzada-titulo .arrow").classList.add("up");
}

document.querySelector("#btn-scroll-top").addEventListener("click", (e) => {
    if (document.querySelector("#overlay").classList.contains("oculto")) {
        e.target.setAttribute("href", "#header-main");
    } else {
        e.target.setAttribute("href", "#header-overlay");
    }
});

function muestraMensajeBusquedaFallida() {
    document.querySelector("#text-error-search").classList.remove("oculto");
}

function ocultaMensajeBusquedaFallida() {
    document.querySelector("#text-error-search").classList.add("oculto");
}

function ocultaScrollBody() {
    document.querySelector("body").style.overflow = "hidden";
}

function muestraScrollBody() {
    document.querySelector("body").style.overflow = "visible";
}

function blurPage() {
    document.querySelector("header").style.filter = "blur(10px)";
    document.querySelector("#cargando").style.filter = "blur(10px)";
    document.querySelector("#text-error-search").style.filter = "blur(10px)";
    document.querySelector("#container-pokemons").style.filter = "blur(10px)";
    document.querySelector("#load-buttons-container").style.filter = "blur(10px)";
    document.querySelector("footer").style.filter = "blur(10px)";

    document.querySelector("header").style.pointerEvents = "none";
    document.querySelector("#cargando").style.pointerEvents = "none";
    document.querySelector("#text-error-search").style.pointerEvents = "none";
    document.querySelector("#container-pokemons").style.pointerEvents = "none";
    document.querySelector("#load-buttons-container").style.pointerEvents = "none";
    document.querySelector("footer").style.pointerEvents = "none";

    document.querySelector("body").classList.add("dark-overlay");
}

function unBlurPage() {
    document.querySelector("header").style.filter = "none";
    document.querySelector("#cargando").style.filter = "none";
    document.querySelector("#text-error-search").style.filter = "none";
    document.querySelector("#container-pokemons").style.filter = "none";
    document.querySelector("#load-buttons-container").style.filter = "none";
    document.querySelector("footer").style.filter = "none";

    document.querySelector("header").style.pointerEvents = "all";
    document.querySelector("#cargando").style.pointerEvents = "all";
    document.querySelector("#text-error-search").style.pointerEvents = "all";
    document.querySelector("#container-pokemons").style.pointerEvents = "all";
    document.querySelector("#load-buttons-container").style.pointerEvents = "all";
    document.querySelector("footer").style.pointerEvents = "all";

    document.querySelector("body").classList.remove("dark-overlay");
}

function putSeparationBar() {
    const $separationBar = document.createElement("img");
    document.querySelector("#overlay").appendChild($separationBar);

    $separationBar.src = "assets/separationBar.png";
    $separationBar.alt = "Image of a line that separates this section from the next one."
    $separationBar.classList.add("separation-bar");
}
