import { useEffect, useState } from "react";
import "./Historial.css";

function Historial() {
    const [entregas, setEntregas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        obtenerHistorial();
    }, []);

    const obtenerHistorial = async () => {
        try {
            const token = localStorage.getItem("access_token");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/entregas/mis-entregas",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo obtener el historial");
            }

            const datos = await respuesta.json();

            setEntregas(datos);
        } catch (error) {
            console.error(error);
            setError("No se pudo cargar tu historial.");
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return (
            <div className="historial-container">
                <p>Cargando historial...</p>
            </div>
        );
    }

    return (
        <div className="historial-container">

            <div className="historial-header">
                <h1>Mi historial</h1>

                <p>
                    Consulta tus donaciones y reciclajes registrados
                    en Eco-TRACE.
                </p>
            </div>

            {error && (
                <div className="historial-error">
                    {error}
                </div>
            )}

            {!error && entregas.length === 0 && (
                <div className="historial-vacio">
                    <h2>No tienes entregas registradas</h2>

                    <p>
                        Cuando registres una donación o reciclaje,
                        aparecerá aquí.
                    </p>
                </div>
            )}

            <div className="historial-lista">

                {entregas.map((entrega) => (
                    <div
                        className="historial-card"
                        key={entrega.id}
                    >

                        <div className="historial-card-icon">
                            ♻️
                        </div>

                        <div className="historial-card-info">

                            <h2>
                                {entrega.tipo}
                            </h2>

                            <p>
                                <strong>Cantidad:</strong>{" "}
                                {entrega.cantidad} {entrega.unidad}
                            </p>

                            <p>
                                <strong>Punto:</strong>{" "}
                                #{entrega.punto_id}
                            </p>

                            <p>
                                <strong>Fecha:</strong>{" "}
                                {new Date(
                                    entrega.fecha
                                ).toLocaleDateString("es-CO")}
                            </p>

                        </div>

                        <div className="historial-card-estado">
                            {entrega.estado}
                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
}

export default Historial;