# Option7 - Assets de Logo

Este diretório contém os arquivos de logo do Option7.

## Estrutura Recomendada

```
logo/
├── option7-logo.svg          # Logo principal em SVG (vetor)
├── option7-logo.png          # Logo principal em PNG (alta resolução)
├── option7-logo-white.svg    # Logo em branco para fundos escuros
├── option7-logo-white.png    # Logo em branco PNG
├── option7-icon.svg          # Ícone/favicon em SVG
├── option7-icon.png          # Ícone/favicon em PNG
├── favicons/                 # Favicons em diferentes tamanhos
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── favicon-192x192.png
└── README.md                 # Este arquivo
```

## Tamanhos Recomendados

### Logo Principal
- **SVG**: Formato vetorial (preferível para web)
- **PNG**: 512x512px, 256x256px, 128x128px

### Ícone/Favicon
- **16x16px**: Favicon padrão
- **32x32px**: Favicon de alta resolução
- **192x192px**: Ícone para PWA/mobile

## Uso no Sistema

### Header
```jsx
<img src="/assets/images/logo/option7-logo-white.svg" alt="Option7" />
```

### Login Page
```jsx
<img src="/assets/images/logo/option7-logo.svg" alt="Option7" />
```

### Favicon
```html
<link rel="icon" href="/assets/images/logo/favicons/favicon-32x32.png" />
```

## Diretrizes de Uso

1. **Fundo Escuro**: Use a versão branca do logo
2. **Fundo Claro**: Use a versão colorida do logo
3. **Espaçamento**: Mantenha espaço adequado ao redor do logo
4. **Proporção**: Sempre mantenha a proporção original

## Formatos Suportados

- **SVG**: Recomendado para web (escalável)
- **PNG**: Para casos que requerem raster
- **ICO**: Para favicons tradicionais (opcional) 