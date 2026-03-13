# Nomsentry Specification
Version: 0.3

Pipeline:

input
-> normalization
-> rule matching
-> composite risk detection
-> script risk detection
-> provisional decision
-> allow override evaluation
-> final decision

Decisions:

allow
review
reject

Priority:

reject > review > allow
