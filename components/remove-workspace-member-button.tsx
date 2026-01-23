"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { Loader2, Trash } from 'lucide-react';
import { UserTypeNew } from '@/types/types';
import { useState } from 'react';
import { removeUser } from '@/actions/workspace';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RemoveWorkspaceUserButtonProps {
    user: UserTypeNew,
    workspaceId: string
}

function RemoveWorkspaceUserButton({ user, workspaceId }: RemoveWorkspaceUserButtonProps) {

    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    async function handleRemoveUser(userId: string) {
        try {
            setIsLoading(true)
            const response = await removeUser(workspaceId, userId);
            if (response.success) {
                toast.success(response.message)
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }

    }

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
                    <AlertDialogAction onClick={() => handleRemoveUser(user.id)} disabled={isLoading}>
                        {isLoading ? 
                        <Loader2 className='w-2 h-2 animate-spin'/>    
                    :
                    "Remove"
                    }
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default RemoveWorkspaceUserButton