import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
} from "@mui/material";

const QuizTable = () => {
  const [quizzes, setQuizzes] = useState([
    { id: 1, name: "React Basics", questions: 10 },
    { id: 2, name: "JavaScript Fundamentals", questions: 15 },
    { id: 3, name: "CSS Mastery", questions: 8 },
    { id: 4, name: "HTML Essentials", questions: 12 },
  ]);

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(2);

  const handleSort = (property) => {
    const isAscending = orderBy === property && order === "asc";
    setOrder(isAscending ? "desc" : "asc");
    setOrderBy(property);

    const sortedQuizzes = [...quizzes].sort((a, b) => {
      if (isAscending) return a[property] > b[property] ? 1 : -1;
      return a[property] < b[property] ? 1 : -1;
    });

    setQuizzes(sortedQuizzes);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={orderBy === "id" ? order : false}>
              <TableSortLabel
                active={orderBy === "id"}
                direction={orderBy === "id" ? order : "asc"}
                onClick={() => handleSort("id")}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === "name" ? order : false}>
              <TableSortLabel
                active={orderBy === "name"}
                direction={orderBy === "name" ? order : "asc"}
                onClick={() => handleSort("name")}
              >
                Quiz Name
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === "questions" ? order : false}>
              <TableSortLabel
                active={orderBy === "questions"}
                direction={orderBy === "questions" ? order : "asc"}
                onClick={() => handleSort("questions")}
              >
                Questions
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quizzes
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((quiz) => (
              <TableRow key={quiz.id} hover>
                <TableCell>{quiz.id}</TableCell>
                <TableCell>{quiz.name}</TableCell>
                <TableCell>{quiz.questions}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[2, 5, 10]}
        component="div"
        count={quizzes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

export default QuizTable;
