#!/bin/bash

# Agent Workflow Example
# This script demonstrates how to use the Deepself CLI in an automated workflow

set -e  # Exit on error

echo "👤 Deepself CLI Persona Creation Workflow"
echo "=========================================="
echo

# Check if authenticated
if ! deepself config --json | jq -e '.data.authenticated' > /dev/null 2>&1; then
    echo "❌ Not authenticated. Please run: deepself login"
    exit 1
fi

# Configuration
MODEL_ID="deep-alex"
TRAINING_LABEL="Personal Training Session"

echo "📝 Step 1: Create a new model"
echo "Model ID: $MODEL_ID"
echo

if deepself models get "$MODEL_ID" --json > /dev/null 2>&1; then
    echo "⚠️  Model already exists, deleting..."
    deepself models delete "$MODEL_ID" --force --quiet
fi

deepself models create "$MODEL_ID" \
    --name "Alex" \
    --json | jq '.data | {model_id, name, created_at}'

echo
echo "✅ Model created successfully"
echo

# Train with a document
echo "📚 Step 2: Train with a document"
echo

cat > /tmp/agent-bio.txt << 'EOF'
My name is Alex. I'm a software engineer based in Seattle.
I specialize in Python, JavaScript, and TypeScript.
In my free time, I enjoy hiking and building CLI tools.
EOF

deepself train document "$MODEL_ID" \
    --label "Biography" \
    --perspective first-person \
    --file /tmp/agent-bio.txt \
    --json | jq '.data.extracted'

echo
echo "✅ Document training completed"
echo

# Begin training room
echo "🎯 Step 3: Begin interactive training room"
echo

ROOM_RESPONSE=$(deepself train room begin "$MODEL_ID" \
    --label "$TRAINING_LABEL" \
    --json)

ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.data.room_id')

echo "Room ID: $ROOM_ID"
echo

# Answer questions
echo "💬 Step 4: Answer training questions"
echo

ANSWERS=(
    "I've been coding for about 8 years, mostly backend development"
    "I really enjoy the challenge of making complex systems simple and maintainable"
    "Outside of work, I'm usually on a hiking trail or trying new coffee shops in Seattle"
)

for i in "${!ANSWERS[@]}"; do
    echo "Answer $((i+1)): ${ANSWERS[$i]}"

    RESPONSE=$(deepself train room respond "$ROOM_ID" \
        --model "$MODEL_ID" \
        --answer "${ANSWERS[$i]}" \
        --json)

    NEXT_QUESTION=$(echo "$RESPONSE" | jq -r '.data.next_question')
    echo "Next Question: $NEXT_QUESTION"
    echo
done

# End training room
echo "🏁 Step 5: Finalize training room"
echo

deepself train room end "$ROOM_ID" --json | jq '.data.stats'

echo
echo "✅ Training completed successfully"
echo

# Chat with the persona
echo "💬 Step 6: Test the trained persona"
echo

CHAT_RESPONSE=$(deepself chat "$MODEL_ID" \
    --message "Tell me about yourself" \
    --json)

echo "$CHAT_RESPONSE" | jq -r '.data.message'

if [ -n "$(echo "$CHAT_RESPONSE" | jq -r '.data.usage')" ]; then
    echo
    echo "Token usage:"
    echo "$CHAT_RESPONSE" | jq '.data.usage'
fi

echo
echo "✅ Chat test successful"
echo

# Update persona with facts
echo "📝 Step 7: Update persona facts"
echo

deepself models update "$MODEL_ID" \
    --add-fact "location:Seattle" \
    --add-fact "occupation:Software Engineer" \
    --json | jq '.data.basic_facts'

echo
echo "✅ Persona updated successfully"
echo

# List all personas
echo "📋 Step 8: List all personas"
echo

deepself models list --json | jq '.data | length' | xargs -I {} echo "Total personas: {}"

echo
echo "🎉 Workflow completed successfully!"
echo
echo "To clean up, run: deepself models delete $MODEL_ID --force"
