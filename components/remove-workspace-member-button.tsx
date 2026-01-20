"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { Trash } from 'lucide-react';
import { UserTypeNew } from '@/types/types';

interface RemoveWorkspaceUserButtonProps {
    onRemove: (userId: string) => Promise<void>,
    user: UserTypeNew
}

function RemoveWorkspaceUserButton({ onRemove, user }: RemoveWorkspaceUserButtonProps) {

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant={"destructive"}
                >
                    <Trash className="h-4 w-4 " />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove this user from the workspace.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(user.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default RemoveWorkspaceUserButton