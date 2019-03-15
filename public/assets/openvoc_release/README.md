# Graph data for ADE20K

This package includes two files: adjList.json, info.json

- adjList.json

Contains two dictionaries, which can be used to build the whole graph:

'adj_hyper': mapping from an node to its hypernym(s)

'adj_hypo': mapping from an node to its hyponym(s)

- info.json

Contains three dictionaries, which are metadata for the graph:

'idx2lemma': mapping from node index to lemmas

'idx2def': mapping from node index to definitions

'ade2idx': mapping from ADE20K indices to node indices
