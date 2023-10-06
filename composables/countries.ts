/**
 * Function is used to handle search input in Lobby/CountrySettings.vue component.
 */
export const filterCountryList = () => {
    useFilteredCountryList().value = useCountryList().value.filter((value) => {
        // Split country name into array of words (ex. "Cost Rica" -> ["Cost", "Rica"]")
        const country_name_array = useCountriesFlagMap().value.get(value)?.name.split(" ");
        let found = false;

        country_name_array?.forEach((partial_name) => {
            // Compare with search input value
            if (partial_name.toLowerCase().startsWith(useCountryInput().value.toLowerCase())) found = true;
        });
        if (found) return value;
    });
};

export const toggleAllCountries = () => {
    const ls = useLobbySettings();
    if (useCountryList().value.length !== ls.value.conf.ccList.length) {
        ls.value.conf.ccList = [];
        // Fill selected countries array with all countries
        useCountryList().value.forEach((value) => ls.value.conf.ccList.push(value));
    } else {
        ls.value.conf.ccList = []; // Empty selected countries array
    }
};

export const fetchCountryList = async () => {
    const response = await fetch(`${useBackendAPI().value}/countryList`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    // Check if response is valid
    if (!response.ok) {
        throw new Error(response.statusText);
    } else {
        useCountryList().value = await response.json();
    }
};
