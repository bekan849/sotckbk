import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes Auth
import authRoutes from './routes/authRoutes';

// Routes Users & Roles
import userRoutes from './routes/userRoutes';
import rolRoutes from './routes/rolRoutes';
import usuarioRolRoutes from './routes/usuarioRolRoutes';

// Routes Productos & Categorías
import categoriaRoutes from './routes/categoriaRoutes';
import productoRoutes from './routes/productoRoutes';
import marcaRoutes from './routes/marcaRoutes';

// Routes Proveedores & Compras
import proveedorRoutes from './routes/proveedorRoutes';
import compraRoutes from './routes/compraRoutes';
import detalleCompraRoutes from './routes/detalleCompraRoutes';

// Routes Ventas
import ventaRoutes from './routes/ventaRoutes';
import detalleVentaRoutes from './routes/detalleVentaRoutes';

// Routes Ganancias
import gananciaDiaRoutes from './routes/gananciaRoutes';
import gananciaPeriodoRoutes from './routes/gananciaPeriodroutes';

// Configuración Inicial
import ConfigGlobal from './routes/configGlobalRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Registro de Rutas
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', rolRoutes);
app.use('/usuario-rol', usuarioRolRoutes);

app.use('/categorias', categoriaRoutes);
app.use('/productos', productoRoutes);
app.use('/marcas', marcaRoutes);

app.use('/proveedores', proveedorRoutes);
app.use('/compras', compraRoutes);
app.use('/detalle-compras', detalleCompraRoutes);

app.use('/ventas', ventaRoutes);
app.use('/detalle-ventas', detalleVentaRoutes);

app.use('/ganancias-dia', gananciaDiaRoutes);
app.use('/ganancias-periodo', gananciaPeriodoRoutes);

app.use('/config', ConfigGlobal);

app.get('/', (req, res) => {
  res.send('API funcionando perfectamente!');
});

export default app;
