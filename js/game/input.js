// Состояние ввода. Изолировано, чтобы на него можно было ссылаться без циклов загрузки.
export const Input = {
    keys: new Set(),
    mx: 0,
    fire: 0,
    alt: 0,
    locked: false,
    paused: false,
    termOpen: false
};