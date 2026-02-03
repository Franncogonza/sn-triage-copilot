# Tests Unitarios - SN Triage Copilot

## 🧪 Configuración

Los tests están configurados con Jest y cubren las funciones críticas de `content.js`.

## 📦 Instalación

```bash
npm install
```

## 🚀 Ejecutar tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage
```

## 📋 Tests implementados

### `parseCSV()`
- ✅ Parse simple CSV con headers
- ✅ Manejo de valores con comillas y comas
- ✅ CSV vacío
- ✅ CSV solo con headers
- ✅ Valores faltantes

### `mapTicketsFromCSV()`
- ✅ Mapeo con headers en inglés
- ✅ Mapeo con headers en español
- ✅ Rows vacíos
- ✅ Skip rows sin número de ticket
- ✅ Headers con mixed case

### `generateInstanceId()`
- ✅ Genera IDs únicos con timestamp
- ✅ Incluye componente de timestamp
- ✅ Longitud máxima de 12 caracteres

### Validación de límite de tickets
- ✅ Advertencia cuando excede límite
- ✅ No advertencia cuando está dentro del límite

### Sanitización de datos
- ✅ Extracción solo de campos esenciales
- ✅ Eliminación de metadata innecesaria

## 📊 Coverage esperado

- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

## 🔧 Configuración

- **jest.config.js**: Configuración principal de Jest
- **jest.setup.js**: Mocks de Chrome API y window.location
- **__tests__/content.test.js**: Tests unitarios

## 📝 Agregar más tests

Para agregar tests de nuevas funciones:

1. Crea un nuevo archivo en `__tests__/` con el patrón `*.test.js`
2. Importa o mockea las funciones a testear
3. Escribe los tests usando `describe()` y `test()`
4. Ejecuta `npm test` para verificar

## 🎯 Próximos tests a implementar

- [ ] Tests para `tryTableApi()`
- [ ] Tests para `tryDOMParse()`
- [ ] Tests de integración end-to-end
- [ ] Tests de performance con datasets grandes
- [ ] Tests de manejo de errores de red

## 💡 Tips

- Usa `npm run test:watch` durante desarrollo
- Revisa el coverage con `npm run test:coverage`
- Los mocks de Chrome API están en `jest.setup.js`
- Mantén los tests simples y enfocados en una sola cosa
