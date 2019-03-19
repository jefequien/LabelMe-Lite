


function Dictionary(dataset) {
    this.dataset = dataset;
    this.entries = {};

    this.wordToEntries = {};
    this.adeToEntry = {};

    if (dataset) {
        this.createIndex();
    }
}

Dictionary.prototype.createIndex = function () {
    for (idx in this.dataset.idx2lemma) {
        var entry = {};
        entry.id = parseInt(idx);
        entry.lemma = this.dataset.idx2lemma[idx];
        entry.definition = this.dataset.idx2def[idx];

        this.entries[entry.id] = entry;
    }

    // this.wordToEntry
    for (id in this.entries) {
        var entry = this.entries[id];
        var keywords = entry.lemma.split(",").map(item => item.trim());
        for (var i = 0; i < keywords.length; i++) {
            if (keywords[i] in this.wordToEntries) {
                this.wordToEntries[keywords[i]].push(entry);
            } else {
                this.wordToEntries[keywords[i]] = [entry];
            }
        }
    }

    // entry.ade_ids
    for (ade_idx in this.dataset.ade2idx) {
        var ade_id = parseInt(ade_idx)
        var id = this.dataset.ade2idx[ade_id];
        var entry = this.entries[id];
        if (entry.ade_ids) {
            entry.ade_ids.push(ade_id);
        } else {
            entry.ade_ids = [ade_id];
        }
    }
}

module.exports = {
    Dictionary: Dictionary
}