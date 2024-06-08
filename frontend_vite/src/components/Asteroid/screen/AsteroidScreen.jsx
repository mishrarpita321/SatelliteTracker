import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../../constants/apiConstants";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AsteroidScreen.css";

const AsteroidScreen = () => {
    const [asteroids, setAsteroids] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAsteroids, setTotalAsteroids] = useState(0);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    useEffect(() => {
        fetchAsteroids();
    }, [currentPage, limit, searchQuery, sortField, sortOrder]);

    const fetchAsteroids = async () => {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.ASTEROIDS}?page=${currentPage}&limit=${limit}&search=${searchQuery}&sortKey=${sortField}&sortDirection=${sortOrder}`
            );
            const data = await response.json();
            setAsteroids(data.asteroids);
            setTotalPages(data.totalPages);
            setTotalAsteroids(data.totalAsteroids);
        } catch (error) {
            console.error("Error fetching asteroids", error);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
    };

    const handleLimitChange = (e) => {
        setLimit(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when limit changes
    };

    return (
        <div className="container">
            <h1 className="text-center my-4">Asteroids</h1>
            <div className="d-flex justify-content-between mb-3">
                <div className="form-group">
                    <label>Asteroids per page:</label>
                    <select className="form-control" value={limit} onChange={handleLimitChange}>
                        {[10, 20, 30, 40, 50].map((val) => (
                            <option key={val} value={val}>
                                {val}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Search:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
            <table className="table table-striped table-dark">
                <thead>
                    <tr>
                        <th onClick={() => handleSort("name")}>Name {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>
                        <th onClick={() => handleSort("diameter")}>Diameter (km) {sortField === "diameter" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>
                        <th onClick={() => handleSort("magnitude")}>Magnitude {sortField === "magnitude" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>
                        <th onClick={() => handleSort("hazardous")}>Potential Hazard {sortField === "hazardous" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {asteroids.map((asteroid) => (
                        <tr key={asteroid._id}>
                            <td>{asteroid.name}</td>
                            <td>{`${asteroid.estimated_diameter?.kilometers?.estimated_diameter_min?.toFixed(2) || 0} - ${asteroid.estimated_diameter?.kilometers?.estimated_diameter_max?.toFixed(2) || 0}`}</td>
                            <td>{asteroid.absolute_magnitude_h}</td>
                            <td>{asteroid.is_potentially_hazardous_asteroid ? "Yes" : "No"}</td>
                            <td>
                                <button className="btn btn-primary">View Details</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} />
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, setPage }) => {
    const getPageNumbers = () => {
        let pages = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) {
                pages.push("...");
            }
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) {
                pages.push("...");
            }
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <nav>
            <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(currentPage - 1)}>
                        Previous
                    </button>
                </li>
                {getPageNumbers().map((page, index) => (
                    <li
                        key={index}
                        className={`page-item ${page === currentPage ? "active" : ""} ${page === "..." ? "disabled" : ""}`}
                    >
                        <button className="page-link" onClick={() => page !== "..." && setPage(page)}>
                            {page}
                        </button>
                    </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(currentPage + 1)}>
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default AsteroidScreen;
