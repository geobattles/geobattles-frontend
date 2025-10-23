
<template>
  <div class="animated-earth-wrapper" aria-hidden="true">
    <div class="earth-img-container">
      <img src="/images/earth.png" alt="" class="animated-earth-img" />
    </div>
  </div>
</template>


<style scoped>
.animated-earth-wrapper {
  width: 260px;
  height: 260px;
  margin: 1.5rem auto 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.earth-img-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.animated-earth-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transform-origin: 50% 50%;
  animation: slow-rotate 24s linear infinite, pop-in 700ms ease-out;
  filter: drop-shadow(0 12px 24px rgba(66,133,91,0.08));
}

@keyframes slow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pop-in {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
