import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Printer, Play, Search, Pencil, CheckCircle, Link, X, Check, GraduationCap, User, Clock, Brain } from "lucide-react";
import type { Game, GameModule, DailyMedDetails, ProcessingStep, LearningAssessment } from "@shared/schema";

interface GeneratedGamesProps {
  games: Game[];
  modules?: GameModule[];
  assessment?: LearningAssessment | null;
  dailyMedResults: DailyMedDetails[];
  processingSteps: ProcessingStep[];
}

export function GeneratedGames({ games, modules, assessment, dailyMedResults, processingSteps }: GeneratedGamesProps) {
  const getGameIcon = (type: string) => {
    switch (type) {
      case "crossword":
        return <Play className="w-4 h-4" />;
      case "wordsearch":
        return <Search className="w-4 h-4" />;
      case "fillblank":
        return <Pencil className="w-4 h-4" />;
      case "multiplechoice":
        return <CheckCircle className="w-4 h-4" />;
      case "matching":
        return <Link className="w-4 h-4" />;
      case "truefalse":
        return <Check className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return { text: "Beginner", className: "bg-green-100 text-green-800", color: "bg-green-500" };
      case "intermediate":
        return { text: "Intermediate", className: "bg-yellow-100 text-yellow-800", color: "bg-yellow-500" };
      case "advanced":
        return { text: "Advanced", className: "bg-red-100 text-red-800", color: "bg-red-500" };
      default:
        return { text: "Basic", className: "bg-slate-100 text-slate-800", color: "bg-slate-500" };
    }
  };

  const getGameBadge = (type: string) => {
    switch (type) {
      case "crossword":
        return { text: "Interactive", className: "bg-blue-100 text-blue-800" };
      case "wordsearch":
        return { text: "Search", className: "bg-green-100 text-green-800" };
      case "fillblank":
        return { text: "Fill-in", className: "bg-purple-100 text-purple-800" };
      case "multiplechoice":
        return { text: "Quiz", className: "bg-orange-100 text-orange-800" };
      case "matching":
        return { text: "Match", className: "bg-teal-100 text-teal-800" };
      case "truefalse":
        return { text: "T/F", className: "bg-indigo-100 text-indigo-800" };
      default:
        return { text: "Game", className: "bg-slate-100 text-slate-800" };
    }
  };

  const renderGamePreview = (game: Game) => {
    switch (game.type) {
      case "crossword":
        return (
          <div className="bg-slate-50 rounded p-3 mb-3">
            <div className="grid grid-cols-5 gap-1">
              {game.grid && game.grid.slice(0, 3).map((row, rowIndex) => 
                row.slice(0, 5).map((cell, colIndex) => (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 text-xs flex items-center justify-center border ${
                      cell && cell !== ' ' && cell !== '' 
                        ? 'bg-white border-slate-300' 
                        : 'bg-slate-200'
                    }`}
                  >
                    {cell && cell !== ' ' ? cell.toUpperCase() : ''}
                  </div>
                ))
              )}
            </div>
            <div className="text-xs text-slate-600 mt-2">
              {game.clues && game.clues[0] && (
                <span>{game.clues[0].number} {game.clues[0].direction}: {game.clues[0].clue}</span>
              )}
            </div>
          </div>
        );

      case "wordsearch":
        return (
          <div className="bg-slate-50 rounded p-3 mb-3">
            <div className="grid grid-cols-6 gap-1 text-xs">
              {game.grid && game.grid.slice(0, 2).map((row, rowIndex) => 
                row.slice(0, 6).map((cell, colIndex) => (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    className="w-5 h-5 bg-white border border-slate-300 flex items-center justify-center"
                  >
                    {cell?.toUpperCase() || ''}
                  </div>
                ))
              )}
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Find: {game.words?.slice(0, 3).join(", ")}
            </div>
          </div>
        );

      case "fillblank":
        return (
          <div className="bg-slate-50 rounded p-3 mb-3 text-sm">
            <p className="mb-2">
              {game.text?.split('_').map((part, index) => (
                <span key={index}>
                  {part}
                  {index < game.text.split('_').length - 1 && (
                    <span className="inline-block w-16 h-6 bg-white border-b-2 border-slate-400 mx-1"></span>
                  )}
                </span>
              ))}
            </p>
            {game.wordBank && game.wordBank.length > 0 && (
              <div className="text-xs text-slate-600">
                Word bank: {game.wordBank.join(", ")}
              </div>
            )}
          </div>
        );

      case "multiplechoice":
        return (
          <div className="bg-slate-50 rounded p-3 mb-3 text-sm">
            {game.questions && game.questions[0] && (
              <>
                <p className="font-medium mb-2">{game.questions[0].question}</p>
                <div className="space-y-1">
                  {game.questions[0].options.map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input type="radio" name="preview" className="mr-2" disabled />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case "matching":
        return (
          <div className="bg-slate-50 rounded p-3 mb-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-left">
                {game.pairs?.slice(0, 3).map((pair, index) => (
                  <div key={index} className="bg-white p-2 rounded border mb-1 text-xs">
                    {pair.left}
                  </div>
                ))}
              </div>
              <div className="text-left">
                {game.pairs?.slice(0, 3).map((pair, index) => (
                  <div key={index} className="bg-white p-2 rounded border mb-1 text-xs">
                    {pair.right}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "truefalse":
        return (
          <div className="bg-slate-50 rounded p-3 mb-3 text-sm">
            {game.questions && game.questions[0] && (
              <>
                <p className="font-medium mb-3">"{game.questions[0].statement}"</p>
                <div className="flex space-x-4">
                  <button className="flex-1 bg-green-100 text-green-800 py-2 rounded hover:bg-green-200 transition-colors">
                    <Check className="w-4 h-4 inline mr-1" />
                    True
                  </button>
                  <button className="flex-1 bg-red-100 text-red-800 py-2 rounded hover:bg-red-200 transition-colors">
                    <X className="w-4 h-4 inline mr-1" />
                    False
                  </button>
                </div>
              </>
            )}
            {game.questions && game.questions.length > 1 && (
              <div className="text-xs text-slate-600 mt-2">
                {game.questions.length} questions available
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-slate-50 rounded p-3 mb-3 text-sm text-slate-600">
            Game preview not available
          </div>
        );
    }
  };

  return (
    <div className="mt-8">
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-medical-green/10 p-2 rounded-lg">
                <GraduationCap className="w-5 h-5 text-medical-green" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Adaptive Learning Modules</h2>
                <p className="text-sm text-slate-600">Personalized educational content with difficulty progression</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export All
              </Button>
              <Button size="sm" className="bg-medical-blue hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </div>

          {/* Assessment Summary */}
          {assessment && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Learning Assessment</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Experience Level</span>
                  </div>
                  <Badge className={getDifficultyBadge(assessment.suggestedStartingLevel).className}>
                    {getDifficultyBadge(assessment.suggestedStartingLevel).text}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Time Available</span>
                  </div>
                  <span className="text-blue-800 capitalize">{assessment.timeConstraints || 'Standard'}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Medication Knowledge</span>
                  </div>
                  <span className="text-blue-800 capitalize">{assessment.medicationFamiliarity || 'Unknown'}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Learning Style</span>
                  </div>
                  <span className="text-blue-800 capitalize">{assessment.preferredLearningStyle || 'Mixed'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Learning Modules Tabs */}
          {modules && modules.length > 0 ? (
            <Tabs defaultValue="beginner" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {modules.map((module) => {
                  const difficultyBadge = getDifficultyBadge(module.level);
                  return (
                    <TabsTrigger key={module.level} value={module.level} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${difficultyBadge.color}`}></div>
                      <span>{difficultyBadge.text}</span>
                      <Badge variant="secondary" className="ml-1">
                        {module.games.length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {modules.map((module) => (
                <TabsContent key={module.level} value={module.level} className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {getDifficultyBadge(module.level).text} Level - {module.title}
                    </h3>
                    <p className="text-sm text-slate-600">{module.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {module.games.map((game, index) => {
                      const badge = getGameBadge(game.type);
                      const difficultyBadge = getDifficultyBadge(game.difficulty);
                      return (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-slate-900">{game.title}</h4>
                            <div className="flex space-x-1">
                              <Badge className={badge.className}>{badge.text}</Badge>
                              <Badge className={difficultyBadge.className}>{difficultyBadge.text}</Badge>
                            </div>
                          </div>
                          
                          {renderGamePreview(game)}
                          
                          <Button 
                            className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200" 
                            variant="secondary"
                          >
                            {getGameIcon(game.type)}
                            <span className="ml-1">
                              {game.type === "crossword" ? "Start Game" :
                               game.type === "wordsearch" ? "Start Search" :
                               game.type === "fillblank" ? "Complete Exercise" :
                               game.type === "multiplechoice" ? "Take Quiz" :
                               game.type === "matching" ? "Start Matching" :
                               game.type === "truefalse" ? "Take Quiz" : "Play Game"}
                            </span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Fallback for legacy games display
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game, index) => {
                const badge = getGameBadge(game.type);
                return (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900">{game.title}</h3>
                      <Badge className={badge.className}>{badge.text}</Badge>
                    </div>
                    
                    {renderGamePreview(game)}
                    
                    <Button 
                      className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200" 
                      variant="secondary"
                    >
                      {getGameIcon(game.type)}
                      <span className="ml-1">
                        {game.type === "crossword" ? "Start Game" :
                         game.type === "wordsearch" ? "Start Search" :
                         game.type === "fillblank" ? "Complete Exercise" :
                         game.type === "multiplechoice" ? "Take Quiz" :
                         game.type === "matching" ? "Start Matching" :
                         game.type === "truefalse" ? "Take Quiz" : "Play Game"}
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generated Content Summary */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Generation Complete</h4>
            </div>
            <p className="text-xs text-green-700">
              Successfully generated {games.length} educational games based on patient's medical conditions. 
              Content sourced from DailyMed database and simplified using OpenAI for patient comprehension.
            </p>
            <div className="mt-2 flex items-center space-x-4 text-xs text-green-700">
              <span>
                <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"/>
                </svg>
                DailyMed: {dailyMedResults.length} medications processed
              </span>
              <span>
                <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                </svg>
                OpenAI: Educational concepts simplified
              </span>
              <span>
                <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5,9V21H1V9H5M9,21A2,2 0 0,1 7,19V9C7,8.45 7.22,7.95 7.59,7.59L14.17,1L15.23,2.06C15.5,2.33 15.67,2.7 15.67,3.11L15.64,3.43L14.69,8H21C22.11,8 23,8.9 23,10V12C23,12.26 22.95,12.5 22.86,12.73L19.84,19.78C19.54,20.5 18.83,21 18,21H9M9,19H18.03L21,12V10H12.21L13.34,4.68L9,9.03V19Z"/>
                </svg>
                Games: {games.length} activities generated
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
