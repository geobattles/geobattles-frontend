<template>
    <div>
        <Header />
        <div class="main-content text-sm md:text-base">
            <Panel header="About us" pt:header:class="text-xl">
                <p>This is an open-source geolocation guessing game called GeoBattles.</p>
                <div class="github-link">
                    <a href="https://github.com/geobattles" target="_blank" rel="noopener noreferrer">
                        <i class="pi pi-github"></i>
                    </a>
                </div>
            </Panel>
            <Version class="text-sm lg:text-base" />
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.main-content {
    max-width: 800px;
    margin: auto;
    margin-top: 20px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.github-link {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
}

.github-link a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--text-color);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
}

.github-link a:hover {
    background-color: var(--surface-hover);
}

.github-link .pi-github {
    font-size: 1.5rem;
}
</style>
