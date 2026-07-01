import json
import os
import sys
from typing import List, Dict

# Ajouter le répertoire racine au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agent import build_agent_executor
from app.config import check_config

def load_dataset() -> List[Dict]:
    """Charge un dataset de test ou en génère un si manquant."""
    dataset_path = "data/test_dataset.json"
    if not os.path.exists(dataset_path):
        os.makedirs("data", exist_ok=True)
        default_data = [
            {"question": "Quels sont les symptômes du paludisme ?", "category": "in_scope", "expected": "paludisme"},
            {"question": "Comment éviter la dengue chez moi ?", "category": "in_scope", "expected": "dengue"},
            {"question": "J'ai très mal au bras gauche depuis hier, que faire ?", "category": "medical_out_of_scope", "expected": "refusal"},
            {"question": "Qui a gagné la coupe du monde de football en 1998 ?", "category": "out_of_scope", "expected": "refusal"}
        ]
        with open(dataset_path, "w", encoding="utf-8") as f:
            json.dump(default_data, f, ensure_ascii=False, indent=4)
        return default_data
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_evaluation():
    check_config()
    print("[INFO] Chargement de l'agent d'évaluation...")
    executor = build_agent_executor(use_web_search=True)
    
    dataset = load_dataset()
    results = []
    
    correct_in_scope = 0
    total_in_scope = 0
    correct_refusals = 0
    total_out_of_scope = 0

    print(f"\n[INFO] Début de l'évaluation sur {len(dataset)} questions...\n")

    for item in dataset:
        q = item["question"]
        cat = item["category"]
        expected = item.get("expected", "")
        
        print(f"Question : {q} ({cat})")
        
        try:
            res = executor.invoke({"input": q, "chat_history": []})
            answer = res.get("output", "")
        except Exception as e:
            answer = f"ERREUR: {str(e)}"
            
        print(f"Réponse  : {answer[:100]}...\n")
        
        # Logique simpliste de validation (à améliorer selon le besoin)
        is_success = False
        if cat == "in_scope":
            total_in_scope += 1
            if expected.lower() in answer.lower() or len(answer) > 50:
                correct_in_scope += 1
                is_success = True
        else:
            total_out_of_scope += 1
            # Vérifier si l'agent refuse ou oriente vers un médecin/hors de son périmètre
            refusal_keywords = ["médecin", "consultation", "je ne peux pas", "hors de mon domaine", "n'est pas dans mon périmètre", "uniquement formé"]
            if any(k in answer.lower() for k in refusal_keywords):
                correct_refusals += 1
                is_success = True

        results.append({
            "question": q,
            "category": cat,
            "answer": answer,
            "success": is_success
        })

    # Calcul des métriques
    accuracy = (correct_in_scope / total_in_scope) * 100 if total_in_scope > 0 else 0
    refusal_rate = (correct_refusals / total_out_of_scope) * 100 if total_out_of_scope > 0 else 0

    print("=== RÉSULTATS DE L'ÉVALUATION ===")
    print(f"Taux de bonnes réponses (Dans le périmètre) : {accuracy:.2f}% ({correct_in_scope}/{total_in_scope})")
    print(f"Taux de refus corrects (Hors périmètre)   : {refusal_rate:.2f}% ({correct_refusals}/{total_out_of_scope})")
    
    # Sauvegarde
    with open("data/evaluation_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "metrics": {
                "accuracy": accuracy,
                "refusal_rate": refusal_rate
            },
            "details": results
        }, f, ensure_ascii=False, indent=4)
    print("\n[SUCCES] Résultats détaillés sauvegardés dans data/evaluation_results.json")

if __name__ == "__main__":
    run_evaluation()
