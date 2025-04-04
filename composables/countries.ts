import type { CountryFlagMap } from "../types/appTypes";

// Countries states
export const useCountryList = () => useState<string[]>("country_list", () => [] as string[]);
export const useFilteredCountryList = () => useState<string[]>("filtered_country_list", () => [] as string[]);
export const useCountryInput = () => useState<string>("country_input", () => "");

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
    const { updateLobbyConfigSetting, lobbySettings } = useLobbyStore();

    if (useCountryList().value.length !== lobbySettings?.conf.ccList.length) {
        updateLobbyConfigSetting("ccList", []);

        // Fill selected countries array with all countries
        const newSettingsCountryList: string[] = [];
        useCountryList().value.forEach((value) => newSettingsCountryList.push(value));
        updateLobbyConfigSetting("ccList", newSettingsCountryList);
    } else {
        updateLobbyConfigSetting("ccList", []);
    }
};

export const fetchCountryList = async () => {
    const endpoint = useAppStore().backendEndpoint;
    const response = await fetch(`${endpoint}/countryList`, {
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

export const getFlagBackgroundPosition = (countryCode: string) => {
    const flag = useCountriesFlagMap().value.get(countryCode);
    if (flag) {
        return `${flag.x}px ${flag.y}px`;
    }
    return "0px 0px";
};

/**
 * State is used to store a Map of country codes and their flag coordinates.
 */
export const useCountriesFlagMap = () =>
    useState<CountryFlagMap>(
        "countries_flags_map",
        () =>
            new Map([
                ["AD", { name: "Andorra", x: -32, y: 0 }],
                ["AE", { name: "United Arab Emirates", x: -64, y: 0 }],
                ["AF", { name: "Afghanistan", x: -96, y: 0 }],
                ["AG", { name: "Antigua and Barbuda", x: -128, y: 0 }],
                ["AI", { name: "Anguilla", x: -160, y: 0 }],
                ["AL", { name: "Albania", x: -192, y: 0 }],
                ["AM", { name: "Armenia", x: -224, y: 0 }],
                ["AO", { name: "Angola", x: -256, y: 0 }],
                ["AQ", { name: "Antarctica", x: -288, y: 0 }],
                ["AR", { name: "Argentina", x: -320, y: 0 }],
                ["AS", { name: "American Samoa", x: -352, y: 0 }],
                ["AT", { name: "Austria", x: -384, y: 0 }],
                ["AU", { name: "Australia", x: -416, y: 0 }],
                ["AW", { name: "Aruba", x: -448, y: 0 }],
                ["AX", { name: "Åland Islands", x: -480, y: 0 }],
                ["AZ", { name: "Azerbaijan", x: -0, y: -24 }],
                ["BA", { name: "Bosnia and Herzegovina", x: -32, y: -24 }],
                ["BB", { name: "Barbados", x: -64, y: -24 }],
                ["BD", { name: "Bangladesh", x: -96, y: -24 }],
                ["BE", { name: "Belgium", x: -128, y: -24 }],
                ["BF", { name: "Burkina Faso", x: -160, y: -24 }],
                ["BG", { name: "Bulgaria", x: -192, y: -24 }],
                ["BH", { name: "Bahrain", x: -224, y: -24 }],
                ["BI", { name: "Burundi", x: -256, y: -24 }],
                ["BJ", { name: "Benin", x: -288, y: -24 }],
                ["BL", { name: "Saint Barthélemy", x: -320, y: -24 }],
                ["BM", { name: "Bermuda", x: -352, y: -24 }],
                ["BN", { name: "Brunei Darussalam", x: -384, y: -24 }],
                ["BO", { name: "Bolivia", x: -416, y: -24 }],
                ["BQ", { name: "Bonaire, Sint Eustatius and Saba", x: -448, y: -24 }],
                ["BR", { name: "Brazil", x: -480, y: -24 }],
                ["BS", { name: "Bahamas", x: -0, y: -48 }],
                ["BT", { name: "Bhutan", x: -32, y: -48 }],
                ["BV", { name: "Bouvet Island", x: -64, y: -48 }],
                ["BW", { name: "Botswana", x: -96, y: -48 }],
                ["BY", { name: "Belarus", x: -128, y: -48 }],
                ["BZ", { name: "Belize", x: -160, y: -48 }],
                ["CA", { name: "Canada", x: -192, y: -48 }],
                ["CC", { name: "Cocos Islands", x: -224, y: -48 }],
                ["CD", { name: "Congo", x: -256, y: -48 }],
                ["CF", { name: "Central African Republic", x: -288, y: -48 }],
                ["CG", { name: "Congo", x: -320, y: -48 }],
                ["CH", { name: "Switzerland", x: -352, y: -48 }],
                ["CI", { name: "Côte d'Ivoire", x: -384, y: -48 }],
                ["CK", { name: "Cook Islands", x: -416, y: -48 }],
                ["CL", { name: "Chile", x: -448, y: -48 }],
                ["CM", { name: "Cameroon", x: -480, y: -48 }],
                ["CN", { name: "China", x: -0, y: -72 }],
                ["CO", { name: "Colombia", x: -32, y: -72 }],
                ["CR", { name: "Costa Rica", x: -64, y: -72 }],
                ["CU", { name: "Cuba", x: -96, y: -72 }],
                ["CV", { name: "Cabo Verde", x: -128, y: -72 }],
                ["CW", { name: "Curaçao", x: -160, y: -72 }],
                ["CX", { name: "Christmas Island", x: -192, y: -72 }],
                ["CY", { name: "Cyprus", x: -224, y: -72 }],
                ["CZ", { name: "Czechia", x: -256, y: -72 }],
                ["DE", { name: "Germany", x: -288, y: -72 }],
                ["DJ", { name: "Djibouti", x: -320, y: -72 }],
                ["DK", { name: "Denmark", x: -352, y: -72 }],
                ["DM", { name: "Dominica", x: -384, y: -72 }],
                ["DO", { name: "Dominican Republic", x: -416, y: -72 }],
                ["DZ", { name: "Algeria", x: -448, y: -72 }],
                ["EC", { name: "Ecuador", x: -480, y: -72 }],
                ["EE", { name: "Estonia", x: -0, y: -96 }],
                ["EG", { name: "Egypt", x: -32, y: -96 }],
                ["EH", { name: "Western Sahara", x: -64, y: -96 }],
                ["ER", { name: "Eritrea", x: -96, y: -96 }],
                ["ES", { name: "Spain", x: -128, y: -96 }],
                ["ET", { name: "Ethiopia", x: -160, y: -96 }],
                ["FI", { name: "Finland", x: -192, y: -96 }],
                ["FJ", { name: "Fiji", x: -224, y: -96 }],
                ["FK", { name: "Falkland Islands", x: -256, y: -96 }],
                ["FM", { name: "Micronesia", x: -288, y: -96 }],
                ["FO", { name: "Faroe Islands", x: -320, y: -96 }],
                ["FR", { name: "France", x: -352, y: -96 }],
                ["GA", { name: "Gabon", x: -384, y: -96 }],
                [
                    "GB",
                    {
                        name: "United Kingdom of Great Britain and Northern Ireland",
                        x: -416,
                        y: -96,
                    },
                ],
                ["GD", { name: "Grenada", x: -448, y: -96 }],
                ["GE", { name: "Georgia", x: -480, y: -96 }],
                ["GF", { name: "French Guiana", x: -0, y: -120 }],
                ["GG", { name: "Guernsey", x: -32, y: -120 }],
                ["GH", { name: "Ghana", x: -64, y: -120 }],
                ["GI", { name: "Gibraltar", x: -96, y: -120 }],
                ["GL", { name: "Greenland", x: -128, y: -120 }],
                ["GM", { name: "Gambia", x: -160, y: -120 }],
                ["GN", { name: "Guinea", x: -192, y: -120 }],
                ["GP", { name: "Guadeloupe", x: -224, y: -120 }],
                ["GQ", { name: "Equatorial Guinea", x: -256, y: -120 }],
                ["GR", { name: "Greece", x: -288, y: -120 }],
                [
                    "GS",
                    {
                        name: "South Georgia and the South Sandwich Islands",
                        x: -320,
                        y: -120,
                    },
                ],
                ["GT", { name: "Guatemala", x: -352, y: -120 }],
                ["GU", { name: "Guam", x: -384, y: -120 }],
                ["GW", { name: "Guinea-Bissau", x: -416, y: -120 }],
                ["GY", { name: "Guyana", x: -448, y: -120 }],
                ["HK", { name: "Hong Kong", x: -480, y: -120 }],
                ["HM", { name: "Heard Island and McDonald Islands", x: -0, y: -144 }],
                ["HN", { name: "Honduras", x: -32, y: -144 }],
                ["HR", { name: "Croatia", x: -64, y: -144 }],
                ["HT", { name: "Haiti", x: -96, y: -144 }],
                ["HU", { name: "Hungary", x: -128, y: -144 }],
                ["ID", { name: "Indonesia", x: -160, y: -144 }],
                ["IE", { name: "Ireland", x: -192, y: -144 }],
                ["IL", { name: "Israel", x: -224, y: -144 }],
                ["IM", { name: "Isle of Man", x: -256, y: -144 }],
                ["IN", { name: "India", x: -288, y: -144 }],
                ["IO", { name: "British Indian Ocean Territory", x: -320, y: -144 }],
                ["IQ", { name: "Iraq", x: -352, y: -144 }],
                ["IR", { name: "Iran", x: -384, y: -144 }],
                ["IS", { name: "Iceland", x: -416, y: -144 }],
                ["IT", { name: "Italy", x: -448, y: -144 }],
                ["JE", { name: "Jersey", x: -480, y: -144 }],
                ["JM", { name: "Jamaica", x: -0, y: -168 }],
                ["JO", { name: "Jordan", x: -32, y: -168 }],
                ["JP", { name: "Japan", x: -64, y: -168 }],
                ["KE", { name: "Kenya", x: -96, y: -168 }],
                ["KG", { name: "Kyrgyzstan", x: -128, y: -168 }],
                ["KH", { name: "Cambodia", x: -160, y: -168 }],
                ["KI", { name: "Kiribati", x: -192, y: -168 }],
                ["KM", { name: "Comoros", x: -224, y: -168 }],
                ["KN", { name: "Saint Kitts and Nevis", x: -256, y: -168 }],
                ["KP", { name: "North Korea", x: -288, y: -168 }],
                ["KR", { name: "South Korea", x: -320, y: -168 }],
                ["KW", { name: "Kuwait", x: -352, y: -168 }],
                ["KY", { name: "Cayman Islands", x: -384, y: -168 }],
                ["KZ", { name: "Kazakhstan", x: -416, y: -168 }],
                ["LA", { name: "Laos", x: -448, y: -168 }],
                ["LB", { name: "Lebanon", x: -480, y: -168 }],
                ["LC", { name: "Saint Lucia", x: -0, y: -192 }],
                ["LI", { name: "Liechtenstein", x: -32, y: -192 }],
                ["LK", { name: "Sri Lanka", x: -64, y: -192 }],
                ["LR", { name: "Liberia", x: -96, y: -192 }],
                ["LS", { name: "Lesotho", x: -128, y: -192 }],
                ["LT", { name: "Lithuania", x: -160, y: -192 }],
                ["LU", { name: "Luxembourg", x: -192, y: -192 }],
                ["LV", { name: "Latvia", x: -224, y: -192 }],
                ["LY", { name: "Libya", x: -256, y: -192 }],
                ["MA", { name: "Morocco", x: -288, y: -192 }],
                ["MC", { name: "Monaco", x: -320, y: -192 }],
                ["MD", { name: "Moldova", x: -352, y: -192 }],
                ["ME", { name: "Montenegro", x: -384, y: -192 }],
                ["MF", { name: "Saint Martin", x: -416, y: -192 }],
                ["MG", { name: "Madagascar", x: -448, y: -192 }],
                ["MH", { name: "Marshall Islands", x: -480, y: -192 }],
                ["MK", { name: "North Macedonia", x: -0, y: -216 }],
                ["ML", { name: "Mali", x: -32, y: -216 }],
                ["MM", { name: "Myanmar", x: -64, y: -216 }],
                ["MN", { name: "Mongolia", x: -96, y: -216 }],
                ["MO", { name: "Macao", x: -128, y: -216 }],
                ["MP", { name: "Northern Mariana Islands", x: -160, y: -216 }],
                ["MQ", { name: "Martinique", x: -192, y: -216 }],
                ["MR", { name: "Mauritania", x: -224, y: -216 }],
                ["MS", { name: "Montserrat", x: -256, y: -216 }],
                ["MT", { name: "Malta", x: -288, y: -216 }],
                ["MU", { name: "Mauritius", x: -320, y: -216 }],
                ["MV", { name: "Maldives", x: -352, y: -216 }],
                ["MW", { name: "Malawi", x: -384, y: -216 }],
                ["MX", { name: "Mexico", x: -416, y: -216 }],
                ["MY", { name: "Malaysia", x: -448, y: -216 }],
                ["MZ", { name: "Mozambique", x: -480, y: -216 }],
                ["NA", { name: "Namibia", x: -0, y: -240 }],
                ["NC", { name: "New Caledonia", x: -32, y: -240 }],
                ["NE", { name: "Niger", x: -64, y: -240 }],
                ["NF", { name: "Norfolk Island", x: -96, y: -240 }],
                ["NG", { name: "Nigeria", x: -128, y: -240 }],
                ["NI", { name: "Nicaragua", x: -160, y: -240 }],
                ["NL", { name: "Netherlands", x: -192, y: -240 }],
                ["NO", { name: "Norway", x: -224, y: -240 }],
                ["NP", { name: "Nepal", x: -256, y: -240 }],
                ["NR", { name: "Nauru", x: -288, y: -240 }],
                ["NU", { name: "Niue", x: -320, y: -240 }],
                ["NZ", { name: "New Zealand", x: -352, y: -240 }],
                ["OM", { name: "Oman", x: -384, y: -240 }],
                ["PA", { name: "Panama", x: -416, y: -240 }],
                ["PE", { name: "Peru", x: -448, y: -240 }],
                ["PF", { name: "French Polynesia", x: -480, y: -240 }],
                ["PG", { name: "Papua New Guinea", x: -0, y: -264 }],
                ["PH", { name: "Philippines", x: -32, y: -264 }],
                ["PK", { name: "Pakistan", x: -64, y: -264 }],
                ["PL", { name: "Poland", x: -96, y: -264 }],
                ["PM", { name: "Saint Pierre and Miquelon", x: -128, y: -264 }],
                ["PN", { name: "Pitcairn", x: -160, y: -264 }],
                ["PR", { name: "Puerto Rico", x: -192, y: -264 }],
                ["PS", { name: "Palestine", x: -224, y: -264 }],
                ["PT", { name: "Portugal", x: -256, y: -264 }],
                ["PW", { name: "Palau", x: -288, y: -264 }],
                ["PY", { name: "Paraguay", x: -320, y: -264 }],
                ["QA", { name: "Qatar", x: -352, y: -264 }],
                ["RE", { name: "Réunion", x: -384, y: -264 }],
                ["RO", { name: "Romania", x: -416, y: -264 }],
                ["RS", { name: "Serbia", x: -448, y: -264 }],
                ["RU", { name: "Russian Federation", x: -480, y: -264 }],
                ["RW", { name: "Rwanda", x: -0, y: -288 }],
                ["SA", { name: "Saudi Arabia", x: -32, y: -288 }],
                ["SB", { name: "Solomon Islands", x: -64, y: -288 }],
                ["SC", { name: "Seychelles", x: -96, y: -288 }],
                ["SD", { name: "Sudan", x: -128, y: -288 }],
                ["SE", { name: "Sweden", x: -160, y: -288 }],
                ["SG", { name: "Singapore", x: -192, y: -288 }],
                [
                    "SH",
                    {
                        name: "Saint Helena, Ascension and Tristan da Cunha",
                        x: -224,
                        y: -288,
                    },
                ],
                ["SI", { name: "Slovenia", x: -256, y: -288 }],
                ["SJ", { name: "Svalbard and Jan Mayen", x: -288, y: -288 }],
                ["SK", { name: "Slovakia", x: -320, y: -288 }],
                ["SL", { name: "Sierra Leone", x: -352, y: -288 }],
                ["SM", { name: "San Marino", x: -384, y: -288 }],
                ["SN", { name: "Senegal", x: -416, y: -288 }],
                ["SO", { name: "Somalia", x: -448, y: -288 }],
                ["SR", { name: "Suriname", x: -480, y: -288 }],
                ["SS", { name: "South Sudan", x: -0, y: -312 }],
                ["ST", { name: "Sao Tome and Principe", x: -32, y: -312 }],
                ["SV", { name: "El Salvador", x: -64, y: -312 }],
                ["SX", { name: "Sint Maarten", x: -96, y: -312 }],
                ["SY", { name: "Syrian Arab Republic", x: -128, y: -312 }],
                ["SZ", { name: "Eswatini", x: -160, y: -312 }],
                ["TC", { name: "Turks and Caicos Islands", x: -192, y: -312 }],
                ["TD", { name: "Chad", x: -224, y: -312 }],
                ["TF", { name: "French Southern Territories", x: -256, y: -312 }],
                ["TG", { name: "Togo", x: -288, y: -312 }],
                ["TH", { name: "Thailand", x: -320, y: -312 }],
                ["TJ", { name: "Tajikistan", x: -352, y: -312 }],
                ["TK", { name: "Tokelau", x: -384, y: -312 }],
                ["TL", { name: "Timor-Leste", x: -416, y: -312 }],
                ["TM", { name: "Turkmenistan", x: -448, y: -312 }],
                ["TN", { name: "Tunisia", x: -480, y: -312 }],
                ["TO", { name: "Tonga", x: -0, y: -336 }],
                ["TR", { name: "Turkey", x: -32, y: -336 }],
                ["TT", { name: "Trinidad and Tobago", x: -64, y: -336 }],
                ["TV", { name: "Tuvalu", x: -96, y: -336 }],
                ["TW", { name: "Taiwan", x: -128, y: -336 }],
                ["TZ", { name: "Tanzania", x: -160, y: -336 }],
                ["UA", { name: "Ukraine", x: -192, y: -336 }],
                ["UG", { name: "Uganda", x: -224, y: -336 }],
                ["UM", { name: "United States Minor Outlying Islands", x: -256, y: -336 }],
                ["US", { name: "United States of America", x: -288, y: -336 }],
                ["UY", { name: "Uruguay", x: -320, y: -336 }],
                ["UZ", { name: "Uzbekistan", x: -352, y: -336 }],
                ["VA", { name: "Holy See", x: -384, y: -336 }],
                ["VC", { name: "Saint Vincent and the Grenadines", x: -416, y: -336 }],
                ["VE", { name: "Venezuela", x: -448, y: -336 }],
                ["VG", { name: "Virgin Islands", x: -480, y: -336 }],
                ["VI", { name: "Virgin Islands", x: -0, y: -360 }],
                ["VN", { name: "Viet Nam", x: -32, y: -360 }],
                ["VU", { name: "Vanuatu", x: -64, y: -360 }],
                ["WF", { name: "Wallis and Futuna", x: -96, y: -360 }],
                ["WS", { name: "Samoa", x: -128, y: -360 }],
                ["YE", { name: "Yemen", x: -160, y: -360 }],
                ["YT", { name: "Mayotte", x: -192, y: -360 }],
                ["ZA", { name: "South Africa", x: -224, y: -360 }],
                ["ZM", { name: "Zambia", x: -256, y: -360 }],
                ["ZW", { name: "Zimbabwe", x: -288, y: -360 }],
            ])
    );
