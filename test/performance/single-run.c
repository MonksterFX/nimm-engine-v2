#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include <stdbool.h>
#include <assert.h>
#include <sys/time.h>

// Constants
#define MAX_SIZE 20
#define ORIENTATION_TOP 2
#define ORIENTATION_BOTTOM -2
#define ORIENTATION_LEFT 1
#define ORIENTATION_RIGHT -1

// Field structure
typedef struct Field {
    int id;
    int row;
    int col;
    int state;  // 0 = empty, 1 = stone
    int pattern_group;
} Field;

// Move structure
typedef struct Move {
    int id;
    int orientation;
} Move;

// Move list structure
typedef struct MoveList {
    Move* moves;
    int count;
    int capacity;
} MoveList;

// GameState structure
typedef struct GameState {
    Field*** rows;
    Field*** columns;
    int rows_count;
    int cols_count;
    int current_player;  // 0 or 1
} GameState;

// Global ID counter for fields
static int id_counter = 0;

// MCTS Node structure
typedef struct MCTSNode {
    GameState* state;
    struct MCTSNode* parent;
    struct MCTSNode** children;
    int children_count;
    int children_capacity;
    Move move;
    int visits;
    int wins;
    MoveList untried_moves;
} MCTSNode;

// MCTS structure
typedef struct MCTS {
    MCTSNode* root;
} MCTS;

// MCTSSolver structure
typedef struct MCTSSolver {
    MCTS* mcts;
} MCTSSolver;

// Forward declarations

Field* field_create(int row, int col);
void field_free(Field* field);
Field* field_copy(Field* field);

GameState* gamestate_create(void);
void gamestate_init(GameState* game, int rows, int cols);
GameState* gamestate_clone(GameState* game);
void gamestate_free(GameState* game);
int gamestate_get_current_player(GameState* game);
bool gamestate_is_finished(GameState* game);
Field* gamestate_get_by_id(GameState* game, int id);
MoveList gamestate_get_all_valid_moves(GameState* game);
void gamestate_take_by_id(GameState* game, int id, int orientation);
int gamestate_get_side_length(GameState* game, int orientation);
Field** gamestate_get_from_side(GameState* game, int index, int orientation);

MoveList movelist_create(void);
void movelist_add(MoveList* list, Move move);
void movelist_free(MoveList* list);
Move movelist_pop(MoveList* list);

MCTSNode* mctsnode_create(GameState* state, MCTSNode* parent, Move move);
void mctsnode_free(MCTSNode* node);
double mctsnode_uct_value(MCTSNode* node);
MCTSNode* mctsnode_best_child(MCTSNode* node);

MCTS* mcts_create(GameState* initialState);
void mcts_free(MCTS* mcts);
void mcts_run(MCTS* mcts, int iterations);
MCTSNode* mcts_select(MCTS* mcts, MCTSNode* node);
MCTSNode* mcts_expand(MCTS* mcts, MCTSNode* node);
int mcts_simulate(MCTS* mcts, GameState* state);
void mcts_backpropagate(MCTS* mcts, MCTSNode* node, int winner);
Move* mcts_best_move(MCTS* mcts);

MCTSSolver* mctssolver_create(void);
void mctssolver_free(MCTSSolver* solver);
void mctssolver_initialize(MCTSSolver* solver, GameState* game);
Move* mctssolver_best_move(MCTSSolver* solver, int iterations);

// Field implementation
Field* field_create(int row, int col) {
    Field* field = (Field*)malloc(sizeof(Field));
    field->id = id_counter++;
    field->row = row;
    field->col = col;
    field->state = 1;
    field->pattern_group = -1;
    return field;
}

void field_free(Field* field) {
    free(field);
}

Field* field_copy(Field* field) {
    Field* copy = (Field*)malloc(sizeof(Field));
    copy->id = field->id;
    copy->row = field->row;
    copy->col = field->col;
    copy->state = field->state;
    copy->pattern_group = field->pattern_group;
    return copy;
}

// MoveList implementation
MoveList movelist_create(void) {
    MoveList list;
    list.capacity = 16;
    list.count = 0;
    list.moves = (Move*)malloc(list.capacity * sizeof(Move));
    return list;
}

void movelist_add(MoveList* list, Move move) {
    if (list->count >= list->capacity) {
        list->capacity *= 2;
        list->moves = (Move*)realloc(list->moves, list->capacity * sizeof(Move));
    }
    list->moves[list->count++] = move;
}

void movelist_free(MoveList* list) {
    free(list->moves);
    list->moves = NULL;
    list->count = 0;
    list->capacity = 0;
}

Move movelist_pop(MoveList* list) {
    if (list->count == 0) {
        Move empty = {0, 0};
        return empty;
    }
    return list->moves[--list->count];
}

// GameState implementation
GameState* gamestate_create(void) {
    GameState* game = (GameState*)malloc(sizeof(GameState));
    game->rows = NULL;
    game->columns = NULL;
    game->rows_count = 0;
    game->cols_count = 0;
    game->current_player = 0;
    return game;
}

void gamestate_init(GameState* game, int rows, int cols) {
    id_counter = 0;
    
    game->rows_count = rows;
    game->cols_count = cols;
    game->current_player = 0;
    
    // Allocate rows
    game->rows = (Field***)malloc(rows * sizeof(Field**));
    for (int i = 0; i < rows; i++) {
        game->rows[i] = (Field**)malloc(cols * sizeof(Field*));
    }
    
    // Allocate columns
    game->columns = (Field***)malloc(cols * sizeof(Field**));
    for (int i = 0; i < cols; i++) {
        game->columns[i] = (Field**)malloc(rows * sizeof(Field*));
    }
    
    // Create fields
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < cols; col++) {
            Field* field = field_create(row, col);
            game->rows[row][col] = field;
            game->columns[col][row] = field;
        }
    }
}

// Load GameState from snapshot data (like TypeScript GameState.load)
GameState* gamestate_load_from_snapshot(int rows, int cols, int current_player, int** data) {
    id_counter = 0;
    
    GameState* game = gamestate_create();
    game->rows_count = rows;
    game->cols_count = cols;
    game->current_player = current_player;
    
    // Allocate rows
    game->rows = (Field***)malloc(rows * sizeof(Field**));
    for (int i = 0; i < rows; i++) {
        game->rows[i] = (Field**)malloc(cols * sizeof(Field*));
    }
    
    // Allocate columns
    game->columns = (Field***)malloc(cols * sizeof(Field**));
    for (int i = 0; i < cols; i++) {
        game->columns[i] = (Field**)malloc(rows * sizeof(Field*));
    }
    
    // Create fields with states from snapshot
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < cols; col++) {
            Field* field = field_create(row, col);
            field->state = data[row][col];
            game->rows[row][col] = field;
            game->columns[col][row] = field;
        }
    }
    
    return game;
}

GameState* gamestate_clone(GameState* game) {
    GameState* clone = gamestate_create();
    clone->rows_count = game->rows_count;
    clone->cols_count = game->cols_count;
    clone->current_player = game->current_player;
    
    // Allocate rows
    clone->rows = (Field***)malloc(clone->rows_count * sizeof(Field**));
    for (int i = 0; i < clone->rows_count; i++) {
        clone->rows[i] = (Field**)malloc(clone->cols_count * sizeof(Field*));
    }
    
    // Allocate columns
    clone->columns = (Field***)malloc(clone->cols_count * sizeof(Field**));
    for (int i = 0; i < clone->cols_count; i++) {
        clone->columns[i] = (Field**)malloc(clone->rows_count * sizeof(Field*));
    }
    
    // Copy fields
    for (int row = 0; row < clone->rows_count; row++) {
        for (int col = 0; col < clone->cols_count; col++) {
            clone->rows[row][col] = field_copy(game->rows[row][col]);
            clone->columns[col][row] = clone->rows[row][col];
        }
    }
    
    return clone;
}

void gamestate_free(GameState* game) {
    if (game->rows) {
        for (int i = 0; i < game->rows_count; i++) {
            if (game->rows[i]) {
                for (int j = 0; j < game->cols_count; j++) {
                    field_free(game->rows[i][j]);
                }
                free(game->rows[i]);
            }
        }
        free(game->rows);
    }
    
    if (game->columns) {
        for (int i = 0; i < game->cols_count; i++) {
            free(game->columns[i]);
        }
        free(game->columns);
    }
    
    free(game);
}

int gamestate_get_current_player(GameState* game) {
    return game->current_player;
}

bool gamestate_is_finished(GameState* game) {
    int stone_count = 0;
    for (int row = 0; row < game->rows_count; row++) {
        for (int col = 0; col < game->cols_count; col++) {
            if (game->rows[row][col]->state == 1) {
                stone_count++;
            }
        }
    }
    return stone_count <= 1;
}

Field* gamestate_get_by_id(GameState* game, int id) {
    for (int row = 0; row < game->rows_count; row++) {
        for (int col = 0; col < game->cols_count; col++) {
            if (game->rows[row][col]->id == id) {
                return game->rows[row][col];
            }
        }
    }
    return NULL;
}

int gamestate_get_side_length(GameState* game, int orientation) {
    if (orientation % 2 == 0) {
        return game->cols_count;
    } else {
        return game->rows_count;
    }
}

Field** gamestate_get_from_side(GameState* game, int index, int orientation) {
    if (orientation % 2 == 0) {
        // top-bottom
        return game->columns[index];
    } else {
        // left-right
        return game->rows[index];
    }
}

MoveList gamestate_get_all_valid_moves(GameState* game) {
    MoveList all_moves = movelist_create();
    int orientations[] = {ORIENTATION_RIGHT, ORIENTATION_LEFT, ORIENTATION_TOP, ORIENTATION_BOTTOM};
    
    // Count stones on board
    int stones_on_board = 0;
    for (int row = 0; row < game->rows_count; row++) {
        for (int col = 0; col < game->cols_count; col++) {
            if (game->rows[row][col]->state == 1) {
                stones_on_board++;
            }
        }
    }
    
    for (int o = 0; o < 4; o++) {
        int orientation = orientations[o];
        int length = gamestate_get_side_length(game, orientation);
        
        for (int i = 0; i < length; i++) {
            Field** arr = gamestate_get_from_side(game, i, orientation);
            int arr_length = (orientation % 2 == 0) ? game->rows_count : game->cols_count;
            bool stone_flag = false;
            int local_stones = stones_on_board;
            
            // Handle negative orientation (reversed array)
            int start_step = 0;
            int step_inc = 1;
            if (orientation < 0) {
                start_step = arr_length - 1;
                step_inc = -1;
            }
            
            for (int step = start_step; (orientation < 0) ? (step >= 0) : (step < arr_length); step += step_inc) {
                if (arr[step]->state == 0 && stone_flag) break;
                
                if (arr[step]->state == 1) {
                    stone_flag = true;
                    local_stones--;
                    if (local_stones == 0) break;
                    
                    Move move;
                    move.id = arr[step]->id;
                    move.orientation = orientation;
                    movelist_add(&all_moves, move);
                }
            }
        }
    }
    
    return all_moves;
}

void gamestate_take_by_id(GameState* game, int id, int orientation) {
    Field* field = gamestate_get_by_id(game, id);
    if (!field) {
        fprintf(stderr, "Error: field with id %d not found\n", id);
        exit(1);
    }
    
    int row = field->row;
    int col = field->col;
    Field** arr = gamestate_get_from_side(game, (orientation % 2 == 0) ? col : row, orientation);
    int arr_length = (orientation % 2 == 0) ? game->rows_count : game->cols_count;
    
    // Calculate takeIndex in original array space
    int take_index = (orientation % 2 == 0) ? row : col;
    
    // Calculate takeNumber in the array (reversed if orientation < 0)
    // This matches TypeScript: takeNumber = orientation < 0 ? arr.length - 1 - takeIndex : takeIndex
    // When orientation < 0, getArray returns a reversed copy, so takeNumber is an index in that reversed array
    int take_number = (orientation < 0) ? arr_length - 1 - take_index : take_index;
    
    // Validate move - iterate from 0 to take_number in the (possibly reversed) array
    // If orientation < 0, we're iterating in the reversed array, which means iterating from end of original
    bool hit_first = false;
    if (orientation < 0) {
        // Iterate from end of original array (which is start of reversed array)
        for (int i = arr_length - 1; i >= arr_length - 1 - take_number; i--) {
            if (arr[i]->state == 1) hit_first = true;
            if (hit_first && arr[i]->state == 0) {
                fprintf(stderr, "Error: invalid move at id %d, orientation %d\n", id, orientation);
                exit(1);
            }
        }
    } else {
        // Iterate from start of original array
        for (int i = 0; i <= take_number; i++) {
            if (arr[i]->state == 1) hit_first = true;
            if (hit_first && arr[i]->state == 0) {
                fprintf(stderr, "Error: invalid move at id %d, orientation %d\n", id, orientation);
                exit(1);
            }
        }
    }
    
    if (!hit_first) {
        fprintf(stderr, "Error: invalid move - no stone hit at id %d\n", id);
        exit(1);
    }
    
    // Execute move
    game->current_player = game->current_player == 0 ? 1 : 0;
    if (orientation < 0) {
        for (int i = arr_length - 1; i >= arr_length - 1 - take_number; i--) {
            arr[i]->state = 0;
        }
    } else {
        for (int i = 0; i <= take_number; i++) {
            arr[i]->state = 0;
        }
    }
}

// MCTS Node implementation
MCTSNode* mctsnode_create(GameState* state, MCTSNode* parent, Move move) {
    MCTSNode* node = (MCTSNode*)malloc(sizeof(MCTSNode));
    node->state = state;
    node->parent = parent;
    node->move = move;
    node->visits = 0;
    node->wins = 0;
    node->children_count = 0;
    node->children_capacity = 16;
    node->children = (MCTSNode**)malloc(node->children_capacity * sizeof(MCTSNode*));
    node->untried_moves = gamestate_get_all_valid_moves(state);
    return node;
}

void mctsnode_free(MCTSNode* node) {
    if (node->state) {
        gamestate_free(node->state);
    }
    movelist_free(&node->untried_moves);
    for (int i = 0; i < node->children_count; i++) {
        mctsnode_free(node->children[i]);
    }
    free(node->children);
    free(node);
}

double mctsnode_uct_value(MCTSNode* node) {
    if (node->visits == 0) return INFINITY;
    if (!node->parent) return 0.0;
    
    double C = sqrt(2.0);
    double exploitation = (double)node->wins / node->visits;
    double exploration = C * sqrt(log((double)node->parent->visits) / node->visits);
    return exploitation + exploration;
}

MCTSNode* mctsnode_best_child(MCTSNode* node) {
    if (node->children_count == 0) return NULL;
    
    MCTSNode* best = node->children[0];
    double best_value = mctsnode_uct_value(best);
    
    for (int i = 1; i < node->children_count; i++) {
        double value = mctsnode_uct_value(node->children[i]);
        if (value > best_value) {
            best_value = value;
            best = node->children[i];
        }
    }
    
    return best;
}

// MCTS implementation
MCTS* mcts_create(GameState* initialState) {
    MCTS* mcts = (MCTS*)malloc(sizeof(MCTS));
    Move empty_move = {0, 0};
    mcts->root = mctsnode_create(initialState, NULL, empty_move);
    return mcts;
}

void mcts_free(MCTS* mcts) {
    if (mcts->root) {
        mctsnode_free(mcts->root);
    }
    free(mcts);
}

MCTSNode* mcts_select(MCTS* mcts, MCTSNode* node) {
    (void)mcts;  // Suppress unused parameter warning
    while (!gamestate_is_finished(node->state)) {
        if (node->untried_moves.count > 0) {
            return node;
        }
        MCTSNode* best = mctsnode_best_child(node);
        if (!best) break;
        node = best;
    }
    return node;
}

MCTSNode* mcts_expand(MCTS* mcts, MCTSNode* node) {
    (void)mcts;  // Suppress unused parameter warning
    if (node->untried_moves.count == 0) return node;
    
    Move move = movelist_pop(&node->untried_moves);
    GameState* next_state = gamestate_clone(node->state);
    gamestate_take_by_id(next_state, move.id, move.orientation);
    
    MCTSNode* child = mctsnode_create(next_state, node, move);
    
    if (node->children_count >= node->children_capacity) {
        node->children_capacity *= 2;
        node->children = (MCTSNode**)realloc(node->children, node->children_capacity * sizeof(MCTSNode*));
    }
    node->children[node->children_count++] = child;
    
    return child;
}

int mcts_simulate(MCTS* mcts, GameState* state) {
    (void)mcts;  // Suppress unused parameter warning
    GameState* sim_state = gamestate_clone(state);
    
    while (!gamestate_is_finished(sim_state)) {
        MoveList moves = gamestate_get_all_valid_moves(sim_state);
        if (moves.count == 0) break;
        
        int random_idx = rand() % moves.count;
        Move move = moves.moves[random_idx];
        gamestate_take_by_id(sim_state, move.id, move.orientation);
        movelist_free(&moves);
    }
    
    int winner = gamestate_get_current_player(sim_state);
    gamestate_free(sim_state);
    return winner;
}

void mcts_backpropagate(MCTS* mcts, MCTSNode* node, int winner) {
    (void)mcts;  // Suppress unused parameter warning
    while (node != NULL) {
        node->visits++;
        int player = gamestate_get_current_player(node->state);
        if (winner == player) {
            node->wins++;
        }
        node = node->parent;
    }
}

void mcts_run(MCTS* mcts, int iterations) {
    for (int i = 0; i < iterations; i++) {
        MCTSNode* node = mcts_select(mcts, mcts->root);
        MCTSNode* expanded = mcts_expand(mcts, node);
        int winner = mcts_simulate(mcts, expanded->state);
        mcts_backpropagate(mcts, expanded, winner);
    }
}

Move* mcts_best_move(MCTS* mcts) {
    if (mcts->root->children_count == 0) return NULL;
    
    MCTSNode* best = mcts->root->children[0];
    
    for (int i = 1; i < mcts->root->children_count; i++) {
        if (mcts->root->children[i]->visits > best->visits) {
            best = mcts->root->children[i];
        }
    }
    
    return &best->move;
}

// MCTSSolver implementation
MCTSSolver* mctssolver_create(void) {
    MCTSSolver* solver = (MCTSSolver*)malloc(sizeof(MCTSSolver));
    solver->mcts = NULL;
    return solver;
}

void mctssolver_free(MCTSSolver* solver) {
    if (solver->mcts) {
        mcts_free(solver->mcts);
    }
    free(solver);
}

void mctssolver_initialize(MCTSSolver* solver, GameState* game) {
    GameState* cloned = gamestate_clone(game);
    solver->mcts = mcts_create(cloned);
}

Move* mctssolver_best_move(MCTSSolver* solver, int iterations) {
    if (solver->mcts) {
        mcts_run(solver->mcts, iterations);
        return mcts_best_move(solver->mcts);
    }
    return NULL;
}

// Simple JSON parsing helper - read JSON from stdin
// Expected format: {"snapshot":{"gameOptions":{"size":[rows,cols]},"data":[[...]]},"currentPlayer":0,"iterations":2000}
int parse_json_input(int* rows, int* cols, int* current_player, int* iterations, int*** data_ptr) {
    // Read stdin line by line
    char buffer[1024 * 64];  // 64KB buffer
    size_t pos = 0;
    int c;
    
    // Read until EOF or newline
    while ((c = getchar()) != EOF && c != '\n' && pos < sizeof(buffer) - 1) {
        buffer[pos++] = c;
    }
    buffer[pos] = '\0';
    
    // Simple parsing - look for key patterns
    // Find "size":[rows,cols]
    char* size_str = strstr(buffer, "\"size\"");
    if (!size_str) {
        return 0;  // Not JSON format, use defaults
    }
    
    // Parse size array
    char* bracket = strchr(size_str, '[');
    if (bracket) {
        *rows = atoi(bracket + 1);
        char* comma = strchr(bracket, ',');
        if (comma) {
            *cols = atoi(comma + 1);
        }
    }
    
    // Find "currentPlayer"
    char* player_str = strstr(buffer, "\"currentPlayer\"");
    if (player_str) {
        char* colon = strchr(player_str, ':');
        if (colon) {
            *current_player = atoi(colon + 1);
        }
    }
    
    // Find "iterations"
    char* iter_str = strstr(buffer, "\"iterations\"");
    if (iter_str) {
        char* colon = strchr(iter_str, ':');
        if (colon) {
            *iterations = atoi(colon + 1);
        }
    }
    
    // Parse data array - find "data":[[
    char* data_str = strstr(buffer, "\"data\"");
    if (data_str) {
        char* bracket = strchr(data_str, '[');
        if (bracket) {
            // Allocate data array
            int** data = (int**)malloc(*rows * sizeof(int*));
            for (int i = 0; i < *rows; i++) {
                data[i] = (int*)malloc(*cols * sizeof(int));
            }
            
            // Parse the 2D array - simple tokenization
            char* ptr = bracket + 1;  // Skip first [
            int row = 0;
            int col = 0;
            int in_number = 0;
            int current_num = 0;
            int negative = 0;
            
            while (*ptr && row < *rows) {
                if (*ptr >= '0' && *ptr <= '9') {
                    if (!in_number) {
                        in_number = 1;
                        current_num = 0;
                        negative = 0;
                    }
                    current_num = current_num * 10 + (*ptr - '0');
                } else if (*ptr == '-') {
                    negative = 1;
                } else if (*ptr == ',' || *ptr == ']') {
                    if (in_number) {
                        data[row][col] = negative ? -current_num : current_num;
                        col++;
                        if (col >= *cols) {
                            col = 0;
                            row++;
                        }
                        in_number = 0;
                    }
                    if (*ptr == ']' && col == 0 && row > 0) {
                        // End of row array
                        if (row >= *rows) break;
                    }
                }
                ptr++;
            }
            
            *data_ptr = data;
            return 1;  // Successfully parsed JSON
        }
    }
    
    return 0;  // Failed to parse
}

// Main function - reads JSON from stdin or uses command line args
// JSON format: {"snapshot":{"gameOptions":{"size":[rows,cols]},"data":[[...]]},"currentPlayer":0,"iterations":2000}
// Or command line: [rows] [cols] [iterations]
int main(int argc, char *argv[]) {
    srand(time(NULL));
    
    int rows = 15;
    int cols = 15;
    int iterations = 2000;
    int current_player = 0;
    int** snapshot_data = NULL;
    GameState* game = NULL;
    
    // Try to parse JSON from stdin first
    int parsed_json = parse_json_input(&rows, &cols, &current_player, &iterations, &snapshot_data);
    
    if (parsed_json && snapshot_data) {
        // Load from snapshot
        game = gamestate_load_from_snapshot(rows, cols, current_player, snapshot_data);
        // Free snapshot data
        for (int i = 0; i < rows; i++) {
            free(snapshot_data[i]);
        }
        free(snapshot_data);
    } else {
        // Fall back to command line arguments or defaults
        if (argc >= 2) {
            rows = atoi(argv[1]);
        }
        if (argc >= 3) {
            cols = atoi(argv[2]);
        }
        if (argc >= 4) {
            iterations = atoi(argv[3]);
        }
        game = gamestate_create();
        gamestate_init(game, rows, cols);
    }
    
    MCTSSolver* solver = mctssolver_create();
    
    struct timeval start, end;
    gettimeofday(&start, NULL);
    
    mctssolver_initialize(solver, game);
    if (solver->mcts) {
        mcts_run(solver->mcts, iterations);
    }
    
    Move* move = mctssolver_best_move(solver, 0);  // Already ran iterations
    
    gettimeofday(&end, NULL);
    
    long seconds = end.tv_sec - start.tv_sec;
    long microseconds = end.tv_usec - start.tv_usec;
    double elapsed = seconds + microseconds * 1e-6;
    
    // Output JSON result
    if (move) {
        printf("{\"success\":true,\"timeMs\":%.3f,\"move\":{\"id\":%d,\"orientation\":%d},\"iterations\":%d}\n",
               elapsed * 1000.0, move->id, move->orientation, iterations);
    } else {
        fprintf(stderr, "{\"success\":false,\"error\":\"No move found\"}\n");
        mctssolver_free(solver);
        gamestate_free(game);
        return 1;
    }
    
    mctssolver_free(solver);
    gamestate_free(game);
    
    return 0;
}

