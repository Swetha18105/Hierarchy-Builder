const samplePayload = {
    data: [
        "A->B", "A->C", "B->D", "C->E", "E->F",
        "X->Y", "Y->Z", "Z->X",
        "P->Q", "Q->R",
        "G->H", "G->H", "G->I",
        "hello", "1->2", "A->"
    ]
};

const inputEl = document.getElementById("inputData");
const outputEl = document.getElementById("output");
const errorEl = document.getElementById("error");
const submitBtn = document.getElementById("submitBtn");
const sampleBtn = document.getElementById("sampleBtn");
const statusPill = document.getElementById("statusPill");

function renderOutput(data) {
    outputEl.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

function setStatus(label, state = "") {
    statusPill.textContent = label;
    statusPill.className = "section-badge status-badge";

    if (state) {
        statusPill.classList.add(state);
    }
}

function parseInputValue(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        throw new Error("Please enter request data first.");
    }

    if (trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);

        if (!parsed || !Array.isArray(parsed.data)) {
            throw new Error('JSON input must be in the format { "data": [...] }.');
        }

        return parsed.data;
    }

    return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

sampleBtn.addEventListener("click", () => {
    inputEl.value = JSON.stringify(samplePayload, null, 2);
    errorEl.textContent = "";
    setStatus("Sample Ready");
});

async function submitData() {
    let dataArray;

    try {
        dataArray = parseInputValue(inputEl.value);
    } catch (error) {
        errorEl.textContent = error.message;
        setStatus("Invalid Input", "error");
        return;
    }

    errorEl.textContent = "";
    submitBtn.disabled = true;
    sampleBtn.disabled = true;
    setStatus("Generating", "loading");

    try {
        const response = await fetch("http://localhost:3000/bfhl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: dataArray })
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        renderOutput(data);
        setStatus("Success");
    } catch (error) {
        errorEl.textContent = "Could not connect to the backend. Make sure the server is running on port 3000.";
        setStatus("Request Failed", "error");
    } finally {
        submitBtn.disabled = false;
        sampleBtn.disabled = false;
    }
}
